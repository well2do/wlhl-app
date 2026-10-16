const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const origin = process.env.TEST_ORIGIN || 'http://localhost:3141';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  let loginRequests = 0;
  let logoutRequests = 0;
  try {
    async function session(cookies = []) {
      const context = await browser.newContext();
      context.setDefaultTimeout(15000);
      if (cookies.length) await context.addCookies(cookies.map(cookie => ({ ...cookie, url: origin })));
      const state = { expired: false };
      await context.route('**/backendApi/**', async route => {
        const request = route.request();
        const path = new URL(request.url()).pathname;
        let data = {};
        if (path.endsWith('/login/doLogin')) {
          loginRequests++;
          const body = request.postDataJSON();
          if (body.username !== 'fixture-shop' || body.password !== 'fixture-password') {
            return route.fulfill({ json: { code: 201, message: '登录账号或密码有误' } });
          }
          data = { token: 'fresh-fixture-session' };
        } else if (path.endsWith('/login/logout')) {
          logoutRequests++;
          return route.fulfill({ json: { code: 500, message: 'Fixture logout service unavailable' } });
        } else if (request.headers()['access-token'] !== 'fresh-fixture-session' || state.expired) {
          return route.fulfill({ json: { code: 401, message: '登录信息已失效，请重新登录' } });
        } else if (path.endsWith('/login/getInfo')) {
          data = { accountInfo: { id: 101, accountName: 'Fixture shop', merchantId: 1, merchantName: 'Fixture club', storeId: 0, avatar: '' }, roles: ['admin'], permissions: ['*:*:*'] };
        } else if (path.endsWith('/login/getRouters')) {
          data = [{ path: '/content', component: 'Layout', name: 'Content', meta: { title: '内容管理' }, children: [{ path: 'article', name: 'Article', component: 'content/article/index', meta: { title: '文章管理' } }] }];
        } else if (path.endsWith('/article/list')) {
          data = { dataList: { content: [], totalElements: 0 }, storeList: [] };
        }
        return route.fulfill({ json: { code: 200, data } });
      });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      return { context, page, state };
    }

    const fresh = await session();
    await fresh.page.goto(origin + '/wlhl-application/index.html#/login');
    assert.equal(await fresh.page.getByPlaceholder('请输入店铺后台账号').inputValue(), '');
    assert.equal(await fresh.page.getByPlaceholder('密码', { exact: true }).inputValue(), '');
    await fresh.page.getByRole('link', { name: '网站会员审核请从这里登录' }).click();
    await fresh.page.getByLabel('网站管理员密码').waitFor();
    await fresh.page.getByRole('link', { name: '店铺、订单和文章管理请使用店铺后台登录。' }).click();
    await fresh.page.getByPlaceholder('请输入店铺后台账号').waitFor();
    await fresh.context.close();

    const remembered = await session([{ name: 'username', value: 'fixture-shop' }, { name: 'password', value: 'invalid-legacy-password-cookie' }, { name: 'rememberMe', value: 'true' }]);
    await remembered.page.goto(origin + '/wlhl-application/index.html#/login');
    assert.equal(await remembered.page.getByPlaceholder('请输入店铺后台账号').inputValue(), 'fixture-shop');
    assert.equal(await remembered.page.getByPlaceholder('密码', { exact: true }).inputValue(), '');
    assert.ok(!(await remembered.context.cookies()).some(cookie => cookie.name === 'password'));
    await remembered.context.close();

    for (const entry of ['wlhl-application', 'funit-application']) {
      const { context, page, state } = await session([{ name: 'Access-Token', value: 'expired-fixture-session' }]);
      await page.goto(`${origin}/${entry}/index.html#/content/article`);
      const username = page.getByPlaceholder('请输入店铺后台账号');
      const password = page.getByPlaceholder('密码', { exact: true });
      await username.waitFor();
      assert.ok(!(await context.cookies()).some(cookie => cookie.name === 'Access-Token'));
      assert.equal(logoutRequests, 0, 'Expired sessions must not require a working logout endpoint');
      await username.fill('fixture-shop');
      await password.fill('wrong-fixture-password');
      await page.getByRole('button', { name: '立即登录' }).click();
      await page.getByText('登录账号或密码有误', { exact: true }).waitFor();
      await password.fill('fixture-password');
      await page.getByRole('button', { name: '立即登录' }).click();
      await page.locator('.el-table').waitFor();
      assert.match(new URL(page.url()).hash, /\/content\/article/);
      state.expired = true;
      await page.locator('.main-search button').filter({ hasText: /搜\s*索/ }).click();
      await page.getByRole('button', { name: '重新登录', exact: true }).click();
      await username.waitFor();
      assert.equal(new URL(page.url()).pathname, `/${entry}/index.html`);
      assert.ok(new URL(page.url()).hash.startsWith('#/login'));
      assert.ok(!(await context.cookies()).some(cookie => cookie.name === 'Access-Token'));
      await context.close();
    }

    const logout = await session([{ name: 'Access-Token', value: 'fresh-fixture-session' }]);
    await logout.page.goto(origin + '/wlhl-application/index.html#/content/article');
    await logout.page.locator('.avatar-wrapper .user-avatar').click();
    await logout.page.getByText('退出登录', { exact: true }).click();
    await logout.page.getByRole('button', { name: '确定', exact: true }).click();
    await logout.page.waitForURL(origin + '/');
    assert.ok(!(await logout.context.cookies()).some(cookie => cookie.name === 'Access-Token'));
    assert.equal(logoutRequests, 1);
    await logout.context.close();
    assert.deepEqual(errors.filter(message => message !== '无效的会话，或者会话已过期，请重新登录。'), []);
    console.log(JSON.stringify({ blankCredentials: 'passed', loginEntryLinks: 'passed', legacyPasswordCookie: 'removed', expiredSessionRecovery: 'passed for both entries', incorrectPasswordRetry: 'passed', logoutServiceFailure: 'passed', loginRequests, productionWrites: 0 }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
