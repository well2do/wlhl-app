const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { spawn } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const assert = require('node:assert/strict');

const origin = 'http://127.0.0.1:3145';
const session = platform => ({ accountInfo: { id: 12, accountName: 'Fixture editor', accountStatus: 1, locked: 0,
  merchantId: platform ? 0 : 1, storeId: 0, merchantName: 'Fixture merchant', storeName: '', avatar: '' }, roles: ['admin'], permissions: ['*:*:*'] });
(async()=>{
  const directory=mkdtempSync(join(tmpdir(),'wlhl-platform-ui-'));
  let app,browser;
  const backend=createServer((request,response)=>{
    const token=request.headers['access-token'];
    response.setHeader('Content-Type','application/json');
    response.end(JSON.stringify(['platform-ui','merchant-ui'].includes(token)?{code:200,data:session(token==='platform-ui')}:{code:401}));
  });
  try {
    await new Promise(resolve=>backend.listen(3146,'127.0.0.1',resolve));
    app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3145'],{
      env:{...process.env,VERCEL:'',TURSO_DATABASE_URL:`file:${join(directory,'site.db')}`,TURSO_AUTH_TOKEN:'',FUINT_API_URL:'http://127.0.0.1:3146',FUINT_MERCHANT_ID:'1',SESSION_SECRET:'platform-ui-secret',ADMIN_PASSWORD:'platform-ui-admin'},stdio:'ignore'});
    let ready=false;for(let i=0;i<100;i++){try{if((await fetch(origin+'/api/health')).ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}assert.ok(ready);
    browser=await chromium.launch({channel:'chrome',headless:true});
    const context=await browser.newContext({viewport:{width:1440,height:1000}});context.setDefaultTimeout(15000);
    await context.addCookies([{name:'Access-Token',value:'platform-ui',url:origin}]);
    await context.route('**/backendApi/**',async route=>{
      const path=new URL(route.request().url()).pathname;
      let data={};
      if(path.endsWith('/login/getInfo')) data=session(true);
      else if(path.endsWith('/login/getRouters')) data=[{path:'/content',component:'Layout',name:'Content',meta:{title:'内容管理'},children:[{path:'article',name:'Article',component:'content/article/index',meta:{title:'文章管理'}}]}];
      else if(path.endsWith('/article/list')) data={dataList:{content:[],totalElements:0},storeList:[]};
      await route.fulfill({json:{code:200,data}});
    });
    await context.route('**/api/articles',route=>route.fulfill({json:{articles:[]}}));
    const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin+'/wlhl-application/index.html#/content/article');
    await page.locator('.sidebar-container a[href="/admin/pages?locale=cn"]').click();
    await page.getByRole('heading',{name:'全站网页内容管理',exact:true}).waitFor();
    assert.equal(new URL(page.url()).pathname,'/admin/pages');
    await page.getByRole('link',{name:'文章列表、详情和首页动态',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('input[name="page"]')?.value==='news');
    await page.locator('[name="copy:0"]').fill('系统管理员发布的动态标题');
    await page.getByRole('button',{name:'保存页面文字',exact:true}).first().click();
    await page.getByRole('status').waitFor();
    await page.screenshot({path:'/tmp/wlhl-platform-content-editor.png'});
    await page.goto(origin+'/cn/news');await page.getByRole('heading',{name:'系统管理员发布的动态标题',exact:true}).waitFor();
    await page.goto(origin+'/shop-manager/events');await page.getByText('管理所有商户的活动和网页',{exact:false}).waitFor();
    await page.goto(origin+'/admin/pages?locale=cn');
    await page.getByRole('button',{name:'Sign out',exact:true}).click();
    await page.waitForURL(origin+'/');
    assert.ok(!(await context.cookies()).some(cookie=>['wlhl_admin','Access-Token'].includes(cookie.name)&&cookie.value));
    await page.goto(origin+'/admin/pages');await page.waitForURL('**/admin/login');
    await context.addCookies([{name:'Access-Token',value:'merchant-ui',url:origin}]);
    await page.goto(origin+'/admin/pages');await page.waitForURL('**/admin/login');
    assert.deepEqual(errors,[]);
    // Exercise the rebuilt standalone article editor without production writes.
    await new Promise((resolve,reject)=>{
      const test=spawn(process.execPath,['tests/content-browser.cjs'],{env:{...process.env,TEST_ORIGIN:origin},stdio:'inherit'});
      test.once('exit',code=>code===0?resolve():reject(new Error('Article browser checks failed')));
    });
    console.log(JSON.stringify({platformNavigation:'passed',sameSessionPagePublishing:'passed',merchantIsolation:'passed',logout:'passed',articleEditor:'passed',productionWrites:0}));
  } finally {
    await browser?.close();app?.kill();backend.closeAllConnections();await new Promise(resolve=>backend.close(resolve));rmSync(directory,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
