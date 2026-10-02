package com.rng.embed.repository;

import com.rng.embed.domain.EmbedAction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data MongoDB repository for EmbedAction documents.
 */
@Repository
public interface EmbedActionRepository extends MongoRepository<EmbedAction, String> {

    Optional<EmbedAction> findByActionId(String actionId);

    List<EmbedAction> findByServerId(String serverId);

    Optional<EmbedAction> findByServerIdAndActionId(String serverId, String actionId);

    void deleteByServerIdAndActionId(String serverId, String actionId);

    boolean existsByActionId(String actionId);
}
