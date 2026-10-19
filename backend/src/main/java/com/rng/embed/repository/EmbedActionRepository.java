package com.rng.embed.repository;

import com.rng.embed.domain.EmbedAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data MongoDB repository for EmbedAction documents.
 */
@Repository
public interface EmbedActionRepository extends MongoRepository<EmbedAction, String> {

    Optional<EmbedAction> findByActionId(String actionId);

    boolean existsByActionId(String actionId);

    @Query("{ '$or': [ { 'serverIds': ?0 }, { 'serverId': ?0 }, { 'isGlobal': true } ] }")
    Page<EmbedAction> findByServerIdOrGlobal(String serverId, Pageable pageable);

    @Query("{ '$or': [ { 'serverIds': ?0 }, { 'serverId': ?0 }, { 'isGlobal': true } ] }")
    List<EmbedAction> findByServerIdOrIsGlobalTrue(String serverId);

    List<EmbedAction> findByIsGlobalTrue();

    void deleteByActionId(String actionId);
}
