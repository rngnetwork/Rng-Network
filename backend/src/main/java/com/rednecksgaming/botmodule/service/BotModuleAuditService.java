// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.botmodule.service;

import com.rednecksgaming.botmodule.model.BotModuleAuditLogDocument;
import com.rednecksgaming.botmodule.repository.BotModuleAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

/**
 * Service for recording immutable bot module configuration audit events in MongoDB.
 * Audit logs are strictly write-only persistence documents and are not exposed in frontend views (Rule 1).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BotModuleAuditService {

    private final BotModuleAuditLogRepository auditLogRepository;

    public void recordAuditLog(
            String scope,
            String serverId,
            String actorId,
            String actorName,
            String action,
            String moduleName,
            Map<String, Object> payloadDiff
    ) {
        try {
            BotModuleAuditLogDocument doc = BotModuleAuditLogDocument.builder()
                    .scope(scope)
                    .serverId(serverId)
                    .actorId(actorId)
                    .actorName(actorName)
                    .action(action)
                    .moduleName(moduleName)
                    .payloadDiff(payloadDiff)
                    .timestamp(Instant.now())
                    .build();

            auditLogRepository.save(doc);
            log.info("Recorded bot module audit log: scope={}, serverId={}, actorId={}, action={}",
                    scope, serverId, actorId, action);
        } catch (Exception e) {
            log.error("Failed to persist bot module audit log event: {}", e.getMessage(), e);
        }
    }
}
