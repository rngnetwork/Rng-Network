package com.rednecksgaming.embed.repository;

import com.rednecksgaming.embed.domain.InteractionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data MongoDB repository for InteractionLog documents.
 */
@Repository
public interface InteractionLogRepository extends MongoRepository<InteractionLog, String> {

    Page<InteractionLog> findByGuildIdOrderByCreatedAtDesc(String guildId, Pageable pageable);

    Page<InteractionLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
