import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer, type Server } from 'node:http';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { issueSession } from '../lib/session-token';

const origin = 'http://localhost:3136';
let backend: Server, app: ChildProcess, directory: string, database: Client;
let output = '', permissionsRevoked = false;
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=', 'base64');
const root = 'wlhl_admin=' + issueSession('admin', 'admin', 'event-test-secret');
const cookie = (token: string) => `Access-Token=${token}`;
const draft = { titleCn: '活动发布测试', descriptionCn: '体操、午餐、社区交流。', locationCn: 'Test park', categoryCn: '社区活动', start: '2099-10-18T11:00', end: '2099-10-18T15:00', capacity: '', status: 'draft' };

async function save(session: string, data: Record<string, unknown>, image = false, from = origin) {
  const body = new FormData(); body.set('event', JSON.stringify(data));
  if (image) body.set('poster', new Blob([png], { type: 'image/png' }), 'poster.png');
  return fetch(origin + '/api/shop-manager/events', { method: 'POST', headers: { Cookie: session, Origin: from }, body });
}
async function list(session: string) {
  const response = await fetch(origin + '/api/shop-manager/events', { headers: { Cookie: session } });
  assert.equal(response.status, 200);
  return (await response.json()).events as Array<Record<string, unknown>>;
}

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'wlhl-event-publishing-'));
  database = createClient({ url: `file:${join(directory, 'events.db')}` });
  backend = createServer((request, response) => {
    const token = request.headers['access-token'];
    const known = ['store7','store8','merchant','readonly','wrong-merchant','member','no-add'].includes(String(token));
    const permissions = permissionsRevoked || token === 'readonly' ? ['content:article:index']
      : token === 'no-add' ? ['content:article:index','content:article:edit'] : ['content:article:index','content:article:add','content:article:edit'];
    response.setHeader('Content-Type','application/json');
    response.end(JSON.stringify(known ? { code: 200, data: {
      accountInfo: { id: 11, accountName: 'Fixture manager', merchantId: token === 'wrong-merchant' ? 2 : 1, storeId: token === 'merchant' ? 0 : token === 'store8' ? 8 : 7 },
      roles: [token === 'member' ? 'user' : 'common'], permissions,
    } } : { code: 1001 }));
  });
  await new Promise<void>(resolve => backend.listen(3137,'127.0.0.1',resolve));
  app = spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port','3136'],{
    env:{...process.env,VERCEL:'',TURSO_DATABASE_URL:`file:${join(directory,'events.db')}`,TURSO_AUTH_TOKEN:'',SESSION_SECRET:'event-test-secret',ADMIN_PASSWORD:'event-test-admin',FUINT_API_URL:'http://127.0.0.1:3137',FUINT_MERCHANT_ID:'1'},
    stdio:['ignore','pipe','pipe'],
  });
  app.stdout?.on('data',chunk=>{output=(output+chunk).slice(-6000)});app.stderr?.on('data',chunk=>{output=(output+chunk).slice(-6000)});
  let ready=false;
  for(let n=0;n<100;n++){try{if((await fetch(origin+'/api/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
  assert.ok(ready,output);
  await database.execute("UPDATE events SET status = 'completed'");
}, { timeout: 20000 });

after(async()=>{app?.kill();backend?.closeAllConnections();await new Promise<void>(resolve=>backend?.close(()=>resolve()));database?.close();await rm(directory,{recursive:true,force:true});});

test('event publishing rejects anonymous, forged, cross-merchant and member sessions', async()=>{
  for(const session of ['',cookie('forged'),cookie('wrong-merchant'),cookie('member')]) {
    assert.equal((await fetch(origin+'/api/shop-manager/events',{headers:{Cookie:session}})).status,401);
    assert.equal((await save(session,draft)).status,401);
  }
  assert.equal((await save(cookie('store7'),draft,false,'https://unrelated.example')).status,403);
  assert.equal((await save(cookie('readonly'),draft)).status,403);
  assert.equal((await save(cookie('no-add'),draft)).status,403);
});

test('shop manager publishes a poster, preserves Eastern time, and cannot change another store event',async()=>{
  const created=await save(cookie('store7'),{...draft,merchantId:2,storeId:8},true);
  assert.equal(created.status,200,await created.clone().text());
  const {id}=await created.json();
  let rows=await list(cookie('store7'));let event=rows.find(e=>e.id===id)!;
  assert.equal(event.store_id,7);assert.equal(event.merchant_id,1);assert.equal(event.event_date,'2099-10-18T15:00:00.000Z');assert.equal(event.end_date,'2099-10-18T19:00:00.000Z');assert.equal(event.capacity,0);
  assert.ok(!(await list(cookie('store8'))).some(e=>e.id===id));
  assert.ok((await list(cookie('merchant'))).some(e=>e.id===id));
  assert.equal((await fetch(origin+'/cn/events/'+id)).status,404);
  const imagePath='/api/landing-page-assets/event-'+id;
  assert.equal((await fetch(origin+imagePath)).status,404);
  const privateImage=await fetch(origin+imagePath,{headers:{Cookie:cookie('store7')}});assert.equal(privateImage.status,200);assert.match(privateImage.headers.get('cache-control')!,/no-store/);
  assert.equal((await fetch(origin+imagePath,{headers:{Cookie:cookie('store8')}})).status,404);
  assert.equal((await save(cookie('store8'),{...draft,id,revision:1,status:'upcoming'})).status,403);
  const published=await save(cookie('store7'),{...draft,id,revision:1,status:'upcoming'});
  assert.equal(published.status,200,await published.clone().text());
  for(const path of ['/cn/events/'+id,'/events/'+id,'/cn/events','/events','/cn','/']) {
    const response=await fetch(origin+path);assert.equal(response.status,200);assert.match(await response.text(),/活动发布测试/);
  }
  const image=await fetch(origin+imagePath);assert.equal(image.status,200);assert.deepEqual(Buffer.from(await image.arrayBuffer()),png);
  assert.equal((await save(cookie('store7'),{...draft,id,revision:1,titleCn:'Stale overwrite'})).status,409);
  event=(await list(cookie('store7'))).find(e=>e.id===id)!;assert.equal(event.status,'upcoming');assert.equal(event.revision,2);
  permissionsRevoked=true;
  assert.equal((await save(cookie('store7'),{...draft,id,revision:2})).status,403);
  permissionsRevoked=false;
  assert.equal((await save(cookie('store7'),{...draft,id,revision:2,status:'cancelled'})).status,200);
  assert.equal((await fetch(origin+'/cn/events/'+id)).status,404);
  assert.doesNotMatch(await(await fetch(origin+'/cn/events')).text(),/活动发布测试/);
});

test('root administrator can publish a club event and validation rejects bad dates and images',async()=>{
  for(const changes of [{end:draft.start},{start:'2099-02-30T11:00'},{capacity:-1},{status:'unknown'}]) {
    assert.equal((await save(root,{...draft,...changes})).status,400);
  }
  const body=new FormData();body.set('event',JSON.stringify(draft));body.set('poster',new Blob(['invalid'],{type:'image/png'}),'invalid.png');
  assert.equal((await fetch(origin+'/api/shop-manager/events',{method:'POST',headers:{Cookie:root,Origin:origin},body})).status,400);
  const response=await save(root,{...draft,titleCn:'Club-wide event',status:'upcoming'},true);assert.equal(response.status,200);
  const {id}=await response.json();const event=(await list(cookie('merchant'))).find(e=>e.id===id)!;assert.equal(event.store_id,0);
  assert.ok(!(await list(cookie('store7'))).some(e=>e.id===id));
  const logs=await database.execute({sql:'SELECT metadata FROM activity_logs WHERE event_id=?',args:[id]});assert.equal(JSON.parse(String(logs.rows[0].metadata)).actorId,'site-admin');
});

test('event fees and payment instructions publish bilingually and remain scoped to their manager', async()=>{
  const registration = {
    registrationUrl: 'https://example.invalid/event-registration',
    feeDetails: 'Members: $10/person\nGuests: $30/person\nInvited guests: free\nOn-site: $35/person',
    feeDetailsCn: '会员：$10/人\n非会员：$30/人\n特邀：免费\n现场支付：$35/人',
    paymentInstructions: 'Zelle: payments@example.invalid\nOn-site payment: $35/person',
    paymentInstructionsCn: 'Zelle：payments@example.invalid\n现场支付：$35/人',
  };
  for (const changes of [
    {registrationUrl:'javascript:alert(1)'}, {registrationUrl:'http://example.invalid/form'},
    {registrationUrl:'https://user:password@example.invalid/form'}, {feeDetails:'x'.repeat(3001)},
  ]) assert.equal((await save(cookie('store7'), {...draft,...registration,...changes})).status, 400);
  const created = await save(cookie('store7'), {...draft,...registration,status:'upcoming'});
  assert.equal(created.status,200);
  const {id} = await created.json();
  for (const [prefix,fee,payment,label] of [
    ['/cn',registration.feeDetailsCn,registration.paymentInstructionsCn,'报名登记'],
    ['',registration.feeDetails,registration.paymentInstructions,'Register'],
  ]) {
    const html = await (await fetch(`${origin}${prefix}/events/${id}`)).text();
    assert.ok(html.includes(fee)); assert.ok(html.includes(payment));
    assert.ok(html.includes(`href="${registration.registrationUrl}"`));
    assert.ok(html.includes(`>${label}</a>`));
  }
  assert.equal((await save(cookie('store8'), {...draft,...registration,id,revision:1,feeDetails:'Free'})).status,403);
  assert.equal((await save(cookie('store7'), {...draft,id,revision:1,status:'upcoming'})).status,200);
  const preserved = (await list(cookie('store7'))).find(event=>event.id===id)!;
  assert.equal(preserved.fee_details,registration.feeDetails);
  assert.equal(preserved.registration_url,registration.registrationUrl);
  assert.equal((await save(cookie('store7'), {...draft,id,revision:2,status:'upcoming',registrationUrl:'',feeDetails:'',feeDetailsCn:'',paymentInstructions:'',paymentInstructionsCn:''})).status,200);
  const cleared = await (await fetch(`${origin}/cn/events/${id}`)).text();
  assert.ok(!cleared.includes('class="event-payment-details"'));
  assert.ok(!cleared.includes(`href="${registration.registrationUrl}"`));
});

test('event page wording publishes per language, remains private by scope, and survives older editors', async()=>{
  for (const pageCopyCn of [[], 'invalid', { unknown: 'text' }, { registrationButton: '' }, { feesHeading: 'x'.repeat(201) }, { capacity: 'No number' }]) {
    assert.equal((await save(cookie('store7'), {...draft, pageCopyCn})).status,400);
  }
  const pageCopyCn = {
    feesHeading: '聚会收费标准', paymentHeading: '如何付款', registrationButton: '立即登记参加',
    registrationNote: '填写表格后请联系店长。\n<script>alert(1)</script>', paymentNote: '',
    posterExpand: '查看聚会海报', capacity: '限 {capacity} 位参加',
  };
  const pageCopy = { feesHeading: 'Gathering prices', registrationButton: 'Join this gathering' };
  const created = await save(cookie('store7'), {...draft, status:'upcoming', capacity:20,
    registrationUrl:'https://example.invalid/form', feeDetailsCn:'会员 $10', paymentInstructionsCn:'现场付款', pageCopyCn, pageCopy }, true);
  assert.equal(created.status,200,await created.clone().text());
  const { id } = await created.json();
  let chinese = await (await fetch(`${origin}/cn/events/${id}`)).text();
  for (const text of ['聚会收费标准','如何付款','立即登记参加','查看聚会海报','限 20 位参加']) assert.ok(chinese.includes(text));
  assert.ok(chinese.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!chinese.includes('<script>alert(1)</script>'));
  assert.ok(!chinese.includes('请按上方说明支付活动费用。'));
  const english = await (await fetch(`${origin}/events/${id}`)).text();
  assert.ok(english.includes('Gathering prices')); assert.ok(english.includes('Join this gathering'));
  assert.ok(!english.includes('聚会收费标准'));
  assert.equal((await save(cookie('store8'), {...draft, id, revision:1, pageCopyCn:{feesHeading:'Forged fees'}})).status,403);
  assert.equal((await save(cookie('readonly'), {...draft, id, revision:1, pageCopyCn:{feesHeading:'Forged fees'}})).status,403);
  assert.equal((await save(cookie('store7'), {...draft, id, revision:1, status:'upcoming'})).status,200);
  const preserved = (await list(cookie('store7'))).find(event => event.id === id)!;
  assert.deepEqual(JSON.parse(String(preserved.page_copy_cn)),pageCopyCn);
  assert.deepEqual(JSON.parse(String(preserved.page_copy)),pageCopy);
  assert.equal((await save(cookie('store7'), {...draft, id, revision:1, pageCopyCn:{feesHeading:'Stale fees'}})).status,409);
  const other = await save(cookie('store7'), {...draft, status:'upcoming', feeDetailsCn:'会员 $10'});
  const otherId = (await other.json()).id;
  const untouched = await (await fetch(`${origin}/cn/events/${otherId}`)).text();
  assert.ok(untouched.includes('活动费用')); assert.ok(!untouched.includes('聚会收费标准'));
  assert.equal((await save(cookie('store7'), {...draft, id, revision:2, status:'upcoming', pageCopyCn:{}})).status,200);
  chinese = await (await fetch(`${origin}/cn/events/${id}`)).text();
  assert.ok(chinese.includes('活动费用')); assert.ok(!chinese.includes('聚会收费标准'));
  assert.ok((await (await fetch(`${origin}/events/${id}`)).text()).includes('Gathering prices'));
});
