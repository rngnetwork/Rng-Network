package com.rng.embed.config;

import com.rng.embed.domain.DispatchLog;
import com.rng.embed.domain.EmbedAction;
import com.rng.embed.domain.InteractionLog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexInfo;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class MongoIndexReconciliationConfig implements CommandLineRunner {

    private final MongoTemplate mongoTemplate;
    public static final long TARGET_TTL_SECONDS = 2592000L; // 30 days

    @Override
    public void run(String... args) {
        reconcileTtl(InteractionLog.class, "createdAt");
        reconcileTtl(DispatchLog.class, "timestamp");
        dropObsoleteIndex(EmbedAction.class, "idx_server_action");
    }

    public void dropObsoleteIndex(Class<?> entityClass, String indexName) {
        try {
            List<IndexInfo> indexes = mongoTemplate.indexOps(entityClass).getIndexInfo();
            for (IndexInfo index : indexes) {
                if (indexName.equals(index.getName())) {
                    log.info("Dropping obsolete index {} on {}", indexName, entityClass.getSimpleName());
                    mongoTemplate.indexOps(entityClass).dropIndex(indexName);
                    break;
                }
            }
        } catch (Exception e) {
            log.warn("Failed to drop obsolete index {} for {}: {}", indexName, entityClass.getSimpleName(), e.getMessage());
        }
    }

    public void reconcileTtl(Class<?> entityClass, String fieldName) {
        try {
            List<IndexInfo> indexes = mongoTemplate.indexOps(entityClass).getIndexInfo();
            boolean hasTargetTtl = false;

            for (IndexInfo index : indexes) {
                if (index.isIndexForFields(List.of(fieldName))) {
                    Optional<Duration> expireAfter = index.getExpireAfter();
                    if (expireAfter.isPresent()) {
                        if (expireAfter.get().getSeconds() != TARGET_TTL_SECONDS) {
                            log.info("Dropping obsolete TTL index {} on {}", index.getName(), entityClass.getSimpleName());
                            mongoTemplate.indexOps(entityClass).dropIndex(index.getName());
                        } else {
                            hasTargetTtl = true;
                        }
                    }
                }
            }

            if (!hasTargetTtl) {
                log.info("Ensuring 30-day TTL index on {}.{}", entityClass.getSimpleName(), fieldName);
                mongoTemplate.indexOps(entityClass).ensureIndex(
                        new Index().on(fieldName, Sort.Direction.ASC).expire(Duration.ofSeconds(TARGET_TTL_SECONDS))
                );
            }
        } catch (Exception e) {
            log.warn("Failed to reconcile TTL index for {}: {}", entityClass.getSimpleName(), e.getMessage());
        }
    }
}
