package com.rednecksgaming.botmodule.repository;

import com.rednecksgaming.botmodule.model.BotModuleDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BotModuleRepository extends MongoRepository<BotModuleDocument, String> {

    Optional<BotModuleDocument> findByScope(String scope);

    Optional<BotModuleDocument> findByScopeAndServerId(String scope, String serverId);

    boolean existsByScopeAndServerId(String scope, String serverId);

    void deleteByScopeAndServerId(String scope, String serverId);
}
