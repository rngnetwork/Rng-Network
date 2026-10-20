package com.rednecksgaming.embed.repository;

import com.rednecksgaming.embed.domain.EmbedTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data MongoDB repository for EmbedTemplate documents.
 */
@Repository
public interface EmbedTemplateRepository extends MongoRepository<EmbedTemplate, String> {

    Optional<EmbedTemplate> findByTemplateId(String templateId);

    boolean existsByTemplateId(String templateId);

    @Query("{ '$or': [ { 'serverId': ?0 }, { 'isPublic': true } ] }")
    Page<EmbedTemplate> findAccessibleTemplates(String serverId, Pageable pageable);

    @Query("{ '$and': [ { '$or': [ { 'serverId': ?0 }, { 'isPublic': true } ] }, { 'category': ?1 } ] }")
    Page<EmbedTemplate> findAccessibleByCategory(String serverId, String category, Pageable pageable);

    @Query("{ '$or': [ { 'serverId': ?0 }, { 'isPublic': true }, { 'authorId': ?1 } ] }")
    Page<EmbedTemplate> findAccessibleTemplates(String serverId, String authorId, Pageable pageable);

    @Query("{ '$and': [ { '$or': [ { 'serverId': ?0 }, { 'isPublic': true }, { 'authorId': ?1 } ] }, { 'category': ?2 } ] }")
    Page<EmbedTemplate> findAccessibleByCategory(String serverId, String authorId, String category, Pageable pageable);

    Page<EmbedTemplate> findByAuthorIdOrderByUpdatedAtDesc(String authorId, Pageable pageable);

    Page<EmbedTemplate> findByIsPublicTrueOrderByCreatedAtDesc(Pageable pageable);

    void deleteByTemplateIdAndAuthorId(String templateId, String authorId);
}
