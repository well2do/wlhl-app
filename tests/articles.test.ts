import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contentMediaUrl, isContentMediaPath } from '../lib/content-media';
import { getPublishedArticles, sanitizeArticleHtml } from '../lib/articles';
import { GET as mediaResponse } from '../app/api/content-media/[...path]/route';

test('legacy images use the bounded media proxy and untrusted schemes are rejected', () => {
  assert.equal(contentMediaUrl('http://localhost:8080/static/uploadFiles/20261014/photo.jpg'), '/api/content-media/static/uploadFiles/20261014/photo.jpg');
  assert.equal(contentMediaUrl('/static/defaultImage/banner.png?v=1'), '/api/content-media/static/defaultImage/banner.png?v=1');
  assert.equal(contentMediaUrl('/api/content-media/static/uploadFiles/photo.png'), '/api/content-media/static/uploadFiles/photo.png');
  assert.equal(contentMediaUrl('javascript:alert(1)'), '');
  assert.equal(isContentMediaPath('/backendApi/article/list'), false);
  assert.equal(isContentMediaPath('/static/uploadFiles/../private.png'), false);
  assert.equal(isContentMediaPath('/static/uploadFiles/key.pem'), false);
});

test('published rich text preserves content and images while removing executable HTML', () => {
  const html = sanitizeArticleHtml('<div>Text <strong>bold</strong><img src="http://localhost:8080/static/uploadFiles/photo.jpg" onerror="alert(1)"><script>alert(1)</script><iframe src="https://example.com"></iframe><a href="javascript:alert(1)">bad link</a></div>');
  assert.match(html, /Text <strong>bold<\/strong>/);
  assert.match(html, /src="\/api\/content-media\/static\/uploadFiles\/photo.jpg"/);
  assert.doesNotMatch(html, /onerror|<script|<iframe|javascript:/);
});

test('article reads paginate with the backend page parameter, refresh changes, and exclude drafts', async () => {
  const originalFetch = globalThis.fetch;
  const calls: number[] = [];
  let title = 'Published';
  globalThis.fetch = (async (_url, options) => {
    const request = JSON.parse(String(options?.body));
    calls.push(request.page);
    assert.equal((options?.headers as Record<string, string>).merchantNo, '10001');
    assert.equal(options?.cache, 'no-store');
    return Response.json({ code: 200, data: { totalPage: 2, content: request.page === 1
      ? [{ id: 1, title, status: 'A', updateTime: 1 }, { id: 2, title: 'Draft', status: 'N' }]
      : [{ id: 3, title: 'New article', status: 'A', updateTime: 2 }] } });
  }) as typeof fetch;
  try {
    const first = await getPublishedArticles();
    assert.deepEqual(calls, [1, 2]);
    assert.deepEqual(first.map(article => article.id), [3, 1]);
    title = 'Changed after save';
    assert.equal((await getPublishedArticles())[1].title, title);
  } finally { globalThis.fetch = originalFetch; }
});

test('media proxy bypasses the tunnel warning without forwarding browser credentials', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url, options) => {
    assert.match(String(url), /\/static\/uploadFiles\/photo.png$/);
    assert.equal((options?.headers as Record<string, string>)['ngrok-skip-browser-warning'], 'true');
    assert.equal((options?.headers as Record<string, string>).Cookie, undefined);
    assert.equal(options?.redirect, 'error');
    return new Response(new Uint8Array([137, 80, 78, 71]), { headers: { 'Content-Type': 'image/png' } });
  }) as typeof fetch;
  try {
    const response = await mediaResponse(new Request('https://wlhl.vercel.app/api/content-media/static/uploadFiles/photo.png', { headers: { Cookie: 'private=value' } }), { params: Promise.resolve({ path: ['static', 'uploadFiles', 'photo.png'] }) });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.equal((await response.arrayBuffer()).byteLength, 4);
    assert.equal((await mediaResponse(new Request('https://wlhl.vercel.app/api/content-media/backendApi/list'), { params: Promise.resolve({ path: ['backendApi', 'list'] }) })).status, 404);
    globalThis.fetch = (async () => new Response('<html>Warning</html>', { headers: { 'Content-Type': 'text/html' } })) as typeof fetch;
    assert.equal((await mediaResponse(new Request('https://wlhl.vercel.app/api/content-media/static/uploadFiles/photo.png'), { params: Promise.resolve({ path: ['static', 'uploadFiles', 'photo.png'] }) })).status, 502);
  } finally { globalThis.fetch = originalFetch; }
});
