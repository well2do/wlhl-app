import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv[2]) throw new Error('Pass the Fuint backend source directory.');
const source = resolve(process.argv[2]);
const java = join(source, 'fuint-application/src/main/java/com/fuint');
function patch(file, replacements) {
  const path = join(java, file);
  let content = readFileSync(path, 'utf8');
  for (const [before, after] of replacements) {
    if (content.includes(after)) continue;
    if (!content.includes(before)) throw new Error(`The backend source has changed: ${file}`);
    content = content.replace(before, after);
  }
  return [path, content];
}
// Validate every replacement before modifying the installed source.
const changes = [
  patch('module/backendApi/controller/common/BackendLoginController.java', [
    ['        List<Long> roleIds = accountService.getRoleIdsByAccountId(accountInfo.getId());',
      '        // Authorization must use current ownership, not the cached login snapshot.\n        accountInfo.setMerchantId(tAccount.getMerchantId());\n        accountInfo.setStoreId(tAccount.getStoreId());\n        accountInfo.setAccountStatus(tAccount.getAccountStatus());\n        accountInfo.setLocked(tAccount.getLocked());\n        List<Long> roleIds = accountService.getRoleIdsByAccountId(accountInfo.getId());'],
  ]),
  patch('common/service/impl/ArticleServiceImpl.java', [
    ['import com.fuint.common.dto.content.ArticleDto;', 'import com.fuint.common.dto.content.ArticleDto;\nimport com.fuint.common.permission.ArticleContentAccess;'],
    ['    private StoreService storeService;', '    private StoreService storeService;\n\n    private ArticleContentAccess articleContentAccess;'],
    ['        if (accountInfo.getMerchantId() != null && !mtArticle.getMerchantId().equals(accountInfo.getMerchantId())) {\n            throw new BusinessCheckException("不同商户，无操作权限");\n        }',
      '        articleContentAccess.requireArticle(accountInfo, mtArticle);\n        articleContentAccess.requireDestination(accountInfo,\n                articleDto.getMerchantId() == null ? mtArticle.getMerchantId() : articleDto.getMerchantId(),\n                articleDto.getStoreId() == null ? mtArticle.getStoreId() : articleDto.getStoreId());'],
  ]),
  patch('module/backendApi/controller/content/BackendArticleController.java', [
    ['import com.fuint.common.dto.content.ArticleDto;', 'import com.fuint.common.dto.content.ArticleDto;\nimport com.fuint.common.permission.ArticleContentAccess;'],
    ['    private StoreService storeService;', '    private StoreService storeService;\n\n    private ArticleContentAccess articleContentAccess;'],
    ['        AccountInfo accountInfo = TokenUtil.getAccountInfo();\n        if (accountInfo.getMerchantId()', '        AccountInfo accountInfo = TokenUtil.getAccountInfo();\n        articleContentAccess.requireAccount(accountInfo);\n        if (accountInfo.getMerchantId()'],
    ['        } else {\n            articleService.addArticle(articleDto);',
      '        } else {\n            if (articleDto.getMerchantId() == null || articleDto.getMerchantId() <= 0) {\n                MtStore store = storeService.queryStoreById(articleDto.getStoreId());\n                if (store != null) articleDto.setMerchantId(store.getMerchantId());\n            }\n            articleContentAccess.requireDestination(accountInfo, articleDto.getMerchantId(), articleDto.getStoreId());\n            articleService.addArticle(articleDto);'],
    ['        if (accountInfo.getMerchantId() != null && accountInfo.getMerchantId() > 0) {\n            if (!articleInfo.getMerchantId().equals(accountInfo.getMerchantId())) {\n                return getFailureResult(1004);\n            }\n        }',
      '        articleContentAccess.requireArticle(accountInfo, articleInfo);'],
  ]),
];
for (const [path, content] of changes) writeFileSync(path, content);
copyFileSync(join(root, 'integrations/fuint-backend/ArticleContentAccess.java'), join(java, 'common/permission/ArticleContentAccess.java'));
const tests = join(source, 'fuint-application/src/test/java/com/fuint/common/permission');
mkdirSync(tests, { recursive: true });
copyFileSync(join(root, 'integrations/fuint-backend/ArticleContentAccessTest.java'), join(tests, 'ArticleContentAccessTest.java'));
console.log('Updated article authorization and installed isolated permission tests. Build and restart the backend separately.');
