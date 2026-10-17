package com.fuint.common.permission;

import com.fuint.common.dto.system.AccountInfo;
import com.fuint.common.enums.AdminRoleEnum;
import com.fuint.common.service.AccountService;
import com.fuint.common.service.DutyService;
import com.fuint.common.service.StoreService;
import com.fuint.framework.exception.BusinessCheckException;
import com.fuint.repository.model.MtArticle;
import com.fuint.repository.model.MtStore;
import com.fuint.repository.model.TDuty;
import com.fuint.repository.model.TAccount;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Objects;

/** Enforces article ownership while allowing the verified platform administrator. */
@Service
@AllArgsConstructor
public class ArticleContentAccess {
    private AccountService accountService;
    private DutyService dutyService;
    private StoreService storeService;

    public boolean isPlatformAdministrator(AccountInfo account) {
        if (account == null || account.getId() == null || !Objects.equals(account.getMerchantId(), 0)
                || !Objects.equals(account.getStoreId(), 0) || account.getAccountStatus() != 1 || account.getLocked() != 0) return false;
        return accountService.getRoleIdsByAccountId(account.getId()).stream().anyMatch(id -> {
            TDuty role = dutyService.getRoleById(id);
            return role != null && AdminRoleEnum.ADMIN.getKey().equals(role.getDutyType());
        });
    }

    public void requireAccount(AccountInfo account) throws BusinessCheckException {
        TAccount current = account == null || account.getId() == null ? null : accountService.getAccountInfoById(account.getId());
        if (current == null) throw new BusinessCheckException("登录信息已失效");
        account.setMerchantId(current.getMerchantId());
        account.setStoreId(current.getStoreId());
        account.setAccountStatus(current.getAccountStatus());
        account.setLocked(current.getLocked());
        if (account == null || account.getMerchantId() == null || account.getStoreId() == null
                || account.getMerchantId() < 0 || account.getStoreId() < 0
                || account.getAccountStatus() != 1 || account.getLocked() != 0
                || (account.getMerchantId() == 0 && !isPlatformAdministrator(account))) {
            throw new BusinessCheckException("无内容管理权限");
        }
    }

    public void requireArticle(AccountInfo account, MtArticle article) throws BusinessCheckException {
        requireAccount(account);
        if (article == null) throw new BusinessCheckException("文章不存在");
        if (isPlatformAdministrator(account)) return;
        if (!Objects.equals(account.getMerchantId(), article.getMerchantId())
                || (account.getStoreId() > 0 && !Objects.equals(account.getStoreId(), article.getStoreId()))) {
            throw new BusinessCheckException("无权修改其他商户或店铺的文章");
        }
    }

    public void requireDestination(AccountInfo account, Integer merchantId, Integer storeId) throws BusinessCheckException {
        MtArticle destination = new MtArticle();
        destination.setMerchantId(merchantId);
        destination.setStoreId(storeId == null ? 0 : storeId);
        requireArticle(account, destination);
        if (merchantId == null || merchantId < 1 || destination.getStoreId() < 0) throw new BusinessCheckException("请选择有效的商户和店铺");
        if (destination.getStoreId() > 0) {
            MtStore store = storeService.queryStoreById(destination.getStoreId());
            if (store == null || !Objects.equals(store.getMerchantId(), merchantId)) throw new BusinessCheckException("店铺不属于此商户");
        }
    }
}
