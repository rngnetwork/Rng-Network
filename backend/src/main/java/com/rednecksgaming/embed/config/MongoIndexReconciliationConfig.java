package com.rednecksgaming.embed.config;

import com.rednecksgaming.botmodule.model.BotModuleAuditLogDocument;
import com.rednecksgaming.embed.domain.DispatchLog;
import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.domain.InteractionLog;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexInfo;
import org.springframework.data.mongodb.core.index.IndexOperations;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

@Slf4j
@Configuration
@ConditionalOnProperty(name = "spring.data.mongodb.auto-index-creation", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class MongoIndexReconciliationConfig implements CommandLineRunner {

    private final MongoTemplate mongoTemplate;
    public static final long TARGET_TTL_SECONDS = 2592000L; // 30 days

    @PostConstruct
    public void init() {
        reconcileAll(this.mongoTemplate);
    }

    @Override
    public void run(String... args) {
        reconcileAll(this.mongoTemplate);
    }

    public static void reconcileAll(MongoTemplate template) {
        if (template == null) {
            return;
        }
        dropObsoleteIndex(template, EmbedAction.class, "idx_server_action");
        reconcileTtl(template, InteractionLog.class, "createdAt");
        reconcileTtl(template, DispatchLog.class, "timestamp");
        reconcileTtl(template, BotModuleAuditLogDocument.class, "timestamp");
    }

    public void dropObsoleteIndex(Class<?> entityClass, String indexName) {
        dropObsoleteIndex(this.mongoTemplate, entityClass, indexName);
    }

    public static void dropObsoleteIndex(MongoTemplate template, Class<?> entityClass, String indexName) {
        try {
            IndexOperations ops = template.indexOps(entityClass);
            if (ops == null) {
                return;
            }
            List<IndexInfo> indexes = ops.getIndexInfo();
            if (indexes == null) {
                return;
            }
            for (IndexInfo index : indexes) {
                if (indexName.equals(index.getName())) {
                    log.info("Dropping obsolete index {} on {}", indexName, entityClass.getSimpleName());
                    ops.dropIndex(indexName);
                    break;
                }
            }
        } catch (Exception e) {
            log.warn("Failed to drop obsolete index {} for {}: {}", indexName, entityClass.getSimpleName(), e.getMessage());
        }
    }

    public void reconcileTtl(Class<?> entityClass, String fieldName) {
        reconcileTtl(this.mongoTemplate, entityClass, fieldName);
    }

    public static void reconcileTtl(MongoTemplate template, Class<?> entityClass, String fieldName) {
        try {
            IndexOperations ops = template.indexOps(entityClass);
            if (ops == null) {
                return;
            }
            List<IndexInfo> indexes = ops.getIndexInfo();
            if (indexes == null) {
                return;
            }
            boolean hasTargetTtl = false;

            for (IndexInfo index : indexes) {
                boolean matchesField = index.isIndexForFields(List.of(fieldName));
                boolean matchesName = fieldName.equals(index.getName());

                if (matchesField || matchesName) {
                    Optional<Duration> expireAfter = index.getExpireAfter();
                    if (expireAfter.isPresent()) {
                        if (expireAfter.get().getSeconds() != TARGET_TTL_SECONDS) {
                            log.info("Dropping obsolete TTL index {} on {}", index.getName(), entityClass.getSimpleName());
                            ops.dropIndex(index.getName());
                        } else {
                            hasTargetTtl = true;
                        }
                    } else if (matchesName) {
                        log.info("Dropping non-TTL index {} with conflicting name on {}", index.getName(), entityClass.getSimpleName());
                        ops.dropIndex(index.getName());
                    }
                }
            }

            if (!hasTargetTtl) {
                log.info("Ensuring 30-day TTL index on {}.{}", entityClass.getSimpleName(), fieldName);
                ops.createIndex(
                        new Index().on(fieldName, Sort.Direction.ASC).expire(Duration.ofSeconds(TARGET_TTL_SECONDS))
                );
            }
        } catch (Exception e) {
            log.warn("Failed to reconcile TTL index for {}: {}", entityClass.getSimpleName(), e.getMessage());
        }
    }
}
