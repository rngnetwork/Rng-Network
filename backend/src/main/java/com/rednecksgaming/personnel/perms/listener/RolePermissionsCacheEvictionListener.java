// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.listener;

import com.rednecksgaming.personnel.perms.event.RolePermissionsUpdatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Evicts cached role permission trees only after the originating database transaction commits.
 */
@Component
public class RolePermissionsCacheEvictionListener {

    private static final Logger log = LoggerFactory.getLogger(RolePermissionsCacheEvictionListener.class);
    private static final String CACHE_NAME = "personnel:role_perms";

    private final CacheManager cacheManager;

    public RolePermissionsCacheEvictionListener(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    /**
     * Evicts the updated role's cache entry after transaction commit to prevent stale reads.
     *
     * @param event committed role permission mutation event
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onRolePermissionsUpdated(RolePermissionsUpdatedEvent event) {
        if (event == null || event.roleId() == null || event.roleId().isBlank()) {
            return;
        }
        log.debug("Evicting {} cache for roleId={} (operator={})", CACHE_NAME, event.roleId(), event.operatorEmail());
        Cache cache = cacheManager.getCache(CACHE_NAME);
        if (cache != null) {
            cache.evict(event.roleId());
        }
    }
}
