import { cpSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(process.argv[2] || '');
if (!process.argv[2] || !existsSync(join(source, 'src/views/content/article/index.vue'))) throw new Error('Pass the installed Fuint Admin source directory.');
const staging = mkdtempSync(join(tmpdir(), 'wlhl-content-admin-'));
for (const entry of readdirSync(source)) {
  if (entry.startsWith('.') || ['node_modules', 'dist'].includes(entry)) continue;
  cpSync(join(source, entry), join(staging, entry), { recursive: true });
}
symlinkSync(join(source, 'node_modules'), join(staging, 'node_modules'), 'dir');
copyFileSync(join(root, 'integrations/fuint-admin/Editor.vue'), join(staging, 'src/components/Editor/index.vue'));
copyFileSync(join(root, 'integrations/fuint-admin/content-media.js'), join(staging, 'src/utils/content-media.js'));
function replace(file, before, after) {
  const path = join(staging, file);
  const content = readFileSync(path, 'utf8');
  if (!content.includes(before)) throw new Error(`The Fuint source has changed: ${file}`);
  writeFileSync(path, content.replace(before, after));
}
replace('src/utils/request.js', "import axios from 'axios'", "import axios from 'axios'\nimport { normalizeMediaResponse } from '@/utils/content-media'");
replace('src/utils/request.js', '  (res) => {', '  (res) => {\n    res.data = normalizeMediaResponse(res.data)');
const article = 'src/views/content/article/index.vue';
replace(article, "uploadHeader: { 'Access-Token': getToken() },", "uploadHeader: { 'Access-Token': getToken(), 'ngrok-skip-browser-warning': 'true' },\n      uploadingContent: false,");
replace(article, ':on-success="handleUploadSuccess"', ':on-success="handleUploadSuccess"\n                :on-error="handleUploadError"\n                :before-upload="validateImage"\n                accept="image/png,image/jpeg,image/gif,image/webp,image/bmp"');
replace(article, '<editor v-model="form.description" :min-height="300" />', '<editor v-model="form.description" :min-height="300" @upload-state="uploadingContent = $event" />');
replace(article, '<el-button type="primary" @click="submitForm">确定</el-button>', '<el-button type="primary" :disabled="uploadingContent" @click="submitForm">确定</el-button>');
replace(article, '      this.form.image = file.data.fileName', "      if (file.code !== 200 || !file.data || !file.data.fileName) {\n        this.$message.error(file.message || '图片上传失败')\n        return\n      }\n      this.form.image = file.data.fileName");
replace(article, '    // 新增按钮操作', `    validateImage(file) {
      if (!/^image\\/(png|jpeg|gif|webp|bmp)$/.test(file.type) || file.size > 5 * 1024 * 1024) {
        this.$message.error('请选择不超过 5MB 的 PNG、JPG、GIF、WebP 或 BMP 图片')
        return false
      }
      this.uploadingContent = true
      return true
    },
    handleUploadError() {
      this.uploadingContent = false
      this.$message.error('图片上传失败，请重试')
    },
    // Open a new article.
`);
replace(article, '    handleUploadSuccess(file) {', '    handleUploadSuccess(file) {\n      this.uploadingContent = false');
replace(article, '    submitForm: function () {', '    submitForm: function () {\n      if (this.uploadingContent) return');
replace(article, '          if (this.form.articleId != undefined) {', '          if (this.form.id) {');
replace(article, '            >修改</el-button\n          >', `            >修改</el-button
          >
          <el-link v-if="scope.row.status === 'A'" :href="'/cn/news/' + scope.row.id" target="_blank" type="primary">查看前台</el-link>`);
replace('src/layout/components/Navbar.vue', '<div class="right-menu">', '<div class="right-menu"><a href="/shop-manager/events" class="right-menu-item" v-hasPermi="[\'content:article:index\']" style="font-weight:600">发布网站活动</a>');
replace('src/layout/components/Sidebar/index.vue', '        <sidebar-item', `        <a href="/admin?view=approvals" v-hasPermi="['member:index']">
          <el-menu-item index="website-member-approvals" class="submenu-title-noDropdown">
            <i class="el-icon-user" /><span slot="title">网站会员审核</span>
          </el-menu-item>
        </a>
        <sidebar-item`);
replace('src/views/member/index.vue', '  <div class="app-container">', `  <div class="app-container">
    <el-alert type="info" :closable="false" show-icon style="margin-bottom:16px">
      <template slot="title">网站入会申请需由网站管理员审核。<a href="/admin?view=approvals" style="text-decoration:underline;font-weight:600">打开网站会员审核</a></template>
    </el-alert>`);
const publicPath = '/wlhl-application/';
const result = spawnSync('npm', ['run', 'build:prod'], {
  cwd: staging, stdio: 'inherit', env: {
    ...process.env, NODE_OPTIONS: '--openssl-legacy-provider',
    VUE_APP_TITLE: '华盛顿长寿康养俱乐部', VUE_APP_PUBLIC_PATH: publicPath,
    VUE_APP_BASE_API: process.env.FUINT_API_URL || 'https://parsley-easiest-qualify.ngrok-free.dev/',
    VUE_APP_SERVER_URL: process.env.FUINT_API_URL || 'https://parsley-easiest-qualify.ngrok-free.dev/',
  },
});
if (result.status !== 0) process.exit(result.status || 1);
// Keep previous chunks so already-open browser tabs can finish loading them.
for (const destination of ['wlhl-application', 'funit-application']) {
  const target = join(root, 'public', destination);
  mkdirSync(target, { recursive: true });
  cpSync(join(staging, 'dist'), target, { recursive: true });
}
console.log(`Built both administration entry points from ${staging}`);
