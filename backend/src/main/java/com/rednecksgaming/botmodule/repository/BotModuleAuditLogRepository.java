package com.rednecksgaming.botmodule.repository;

import com.rednecksgaming.botmodule.model.BotModuleAuditLogDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BotModuleAuditLogRepository extends MongoRepository<BotModuleAuditLogDocument, String> {

    Page<BotModuleAuditLogDocument> findByScopeAndServerId(String scope, String serverId, Pageable pageable);

    Page<BotModuleAuditLogDocument> findByScope(String scope, Pageable pageable);

    Page<BotModuleAuditLogDocument> findByActorId(String actorId, Pageable pageable);
}
