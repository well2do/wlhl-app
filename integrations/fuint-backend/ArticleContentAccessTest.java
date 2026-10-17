package com.fuint.common.permission;

import com.fuint.common.dto.system.AccountInfo;
import com.fuint.common.dto.content.ArticleDto;
import com.fuint.common.service.AccountService;
import com.fuint.common.service.DutyService;
import com.fuint.common.service.StoreService;
import com.fuint.common.service.impl.ArticleServiceImpl;
import com.fuint.framework.exception.BusinessCheckException;
import com.fuint.repository.mapper.MtArticleMapper;
import com.fuint.repository.model.MtArticle;
import com.fuint.repository.model.MtStore;
import com.fuint.repository.model.TDuty;
import com.fuint.repository.model.TAccount;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.Collections;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class ArticleContentAccessTest {
    private final AccountService accounts = mock(AccountService.class);
    private final DutyService duties = mock(DutyService.class);
    private final StoreService stores = mock(StoreService.class);
    private final ArticleContentAccess access = new ArticleContentAccess(accounts, duties, stores);

    private AccountInfo account(int merchant, int store) {
        AccountInfo account = new AccountInfo(); account.setId(1); account.setAccountStatus(1);
        account.setMerchantId(merchant); account.setStoreId(store); account.setLocked(0);
        TAccount current = new TAccount(); current.setMerchantId(merchant); current.setStoreId(store); current.setAccountStatus(1); current.setLocked(0);
        when(accounts.getAccountInfoById(1)).thenReturn(current);
        return account;
    }
    private void platformRole() {
        TDuty role = new TDuty(); role.setDutyType("1");
        when(accounts.getRoleIdsByAccountId(1)).thenReturn(Collections.singletonList(1L));
        when(duties.getRoleById(1L)).thenReturn(role);
    }
    private MtArticle article(int merchant, int store) {
        MtArticle article = new MtArticle(); article.setId(501); article.setMerchantId(merchant); article.setStoreId(store); return article;
    }

    @Test public void platformCanEditOtherMerchantsAndMerchantAdminCannot() throws Exception {
        platformRole();
        access.requireArticle(account(0,0),article(1,7)); access.requireArticle(account(0,0),article(2,8));
        assertThrows(BusinessCheckException.class, () -> access.requireArticle(account(1,0),article(2,8)));
        assertThrows(BusinessCheckException.class, () -> access.requireArticle(account(1,7),article(1,8)));
        access.requireArticle(account(1,0),article(1,8)); access.requireArticle(account(1,7),article(1,7));
    }
    @Test public void platformScopeAloneDoesNotGrantAdministratorRights() {
        when(accounts.getRoleIdsByAccountId(1)).thenReturn(Collections.emptyList());
        assertThrows(BusinessCheckException.class, () -> access.requireArticle(account(0,0),article(1,7)));
        assertThrows(BusinessCheckException.class, () -> access.requireArticle(null,article(1,7)));
        AccountInfo disabled = account(0,0); disabled.setAccountStatus(0);
        assertFalse(access.isPlatformAdministrator(disabled));
        AccountInfo locked = account(0,0); locked.setLocked(1); assertFalse(access.isPlatformAdministrator(locked));
    }
    @Test public void destinationCannotMoveContentIntoAnUnrelatedStore() throws Exception {
        platformRole(); MtStore store = new MtStore(); store.setMerchantId(2); when(stores.queryStoreById(8)).thenReturn(store);
        access.requireDestination(account(0,0),2,8);
        assertThrows(BusinessCheckException.class, () -> access.requireDestination(account(0,0),1,8));
        assertThrows(BusinessCheckException.class, () -> access.requireDestination(account(1,7),1,8));
    }
    @Test public void cachedPlatformClaimsCannotSurviveAccountReassignment() {
        platformRole(); AccountInfo cached = account(0,0);
        TAccount reassigned = new TAccount(); reassigned.setMerchantId(1); reassigned.setStoreId(0); reassigned.setAccountStatus(1); reassigned.setLocked(0);
        when(accounts.getAccountInfoById(1)).thenReturn(reassigned);
        assertThrows(BusinessCheckException.class, () -> access.requireArticle(cached,article(2,0)));
    }
    @Test public void articleSaveAllowsPlatformUpdatesWithoutChangingOwnership() throws Exception {
        platformRole(); MtArticle existing = article(2,0); existing.setStatus("A"); existing.setTitle("Original");
        MtArticleMapper mapper = mock(MtArticleMapper.class);
        ArticleServiceImpl service = mock(ArticleServiceImpl.class, CALLS_REAL_METHODS);
        ReflectionTestUtils.setField(service,"mtArticleMapper",mapper);
        ReflectionTestUtils.setField(service,"articleContentAccess",access);
        doReturn(existing).when(service).queryArticleById(501);
        ArticleDto update = new ArticleDto(); update.setId(501); update.setTitle("Updated by platform");
        MtArticle saved = service.updateArticle(update,account(0,0));
        assertEquals("Updated by platform",saved.getTitle()); assertEquals(Integer.valueOf(2),saved.getMerchantId()); assertEquals(Integer.valueOf(0),saved.getStoreId());
        verify(mapper).updateById(existing);
        assertThrows(BusinessCheckException.class, () -> service.updateArticle(update,account(1,0)));
    }
}
