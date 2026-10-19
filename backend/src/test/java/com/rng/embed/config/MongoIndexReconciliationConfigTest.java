package com.rng.embed.config;

import com.rng.embed.domain.DispatchLog;
import com.rng.embed.domain.EmbedAction;
import com.rng.embed.domain.InteractionLog;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.IndexDefinition;
import org.springframework.data.mongodb.core.index.IndexInfo;
import org.springframework.data.mongodb.core.index.IndexOperations;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MongoIndexReconciliationConfigTest {

    @Mock
    private MongoTemplate mongoTemplate;

    @Mock
    private IndexOperations interactionIndexOps;

    @Mock
    private IndexOperations dispatchIndexOps;

    @Mock
    private IndexOperations embedActionIndexOps;

    @InjectMocks
    private MongoIndexReconciliationConfig reconciliationConfig;

    @BeforeEach
    void setUp() {
        lenient().when(mongoTemplate.indexOps(InteractionLog.class)).thenReturn(interactionIndexOps);
        lenient().when(mongoTemplate.indexOps(DispatchLog.class)).thenReturn(dispatchIndexOps);
        lenient().when(mongoTemplate.indexOps(EmbedAction.class)).thenReturn(embedActionIndexOps);
    }

    @Test
    @DisplayName("Should drop obsolete 90-day TTL index and create 30-day index on startup")
    void should_drop_obsolete_ttl_and_ensure_30_day_ttl_index() {
        IndexInfo obsoleteIndex = mock(IndexInfo.class);
        when(obsoleteIndex.isIndexForFields(List.of("createdAt"))).thenReturn(true);
        when(obsoleteIndex.getExpireAfter()).thenReturn(Optional.of(Duration.ofSeconds(7776000L)));
        when(obsoleteIndex.getName()).thenReturn("createdAt_ttl_90d");

        when(interactionIndexOps.getIndexInfo()).thenReturn(List.of(obsoleteIndex));
        when(dispatchIndexOps.getIndexInfo()).thenReturn(List.of());

        reconciliationConfig.run();

        verify(interactionIndexOps).dropIndex("createdAt_ttl_90d");

        ArgumentCaptor<IndexDefinition> captor = ArgumentCaptor.forClass(IndexDefinition.class);
        verify(interactionIndexOps).ensureIndex(captor.capture());
        assertThat(captor.getValue().getIndexOptions()).containsEntry("expireAfterSeconds", 2592000L);
    }

    @Test
    @DisplayName("Should ensure 30-day TTL index when no TTL index is present")
    void should_ensure_30_day_ttl_index_when_no_ttl_index_present() {
        when(interactionIndexOps.getIndexInfo()).thenReturn(List.of());
        when(dispatchIndexOps.getIndexInfo()).thenReturn(List.of());

        reconciliationConfig.run();

        verify(interactionIndexOps, never()).dropIndex(any());
        verify(dispatchIndexOps, never()).dropIndex(any());

        verify(interactionIndexOps).ensureIndex(any(IndexDefinition.class));
        verify(dispatchIndexOps).ensureIndex(any(IndexDefinition.class));
    }

    @Test
    @DisplayName("Should retain existing 30-day TTL index without dropping or recreating")
    void should_retain_30_day_ttl_index_when_already_matching() {
        IndexInfo validIndex = mock(IndexInfo.class);
        when(validIndex.isIndexForFields(List.of("createdAt"))).thenReturn(true);
        when(validIndex.getExpireAfter()).thenReturn(Optional.of(Duration.ofSeconds(2592000L)));

        when(interactionIndexOps.getIndexInfo()).thenReturn(List.of(validIndex));
        when(dispatchIndexOps.getIndexInfo()).thenReturn(List.of());

        reconciliationConfig.run();

        verify(interactionIndexOps, never()).dropIndex(any());
        verify(interactionIndexOps, never()).ensureIndex(any(IndexDefinition.class));
    }

    @Test
    @DisplayName("Should drop obsolete idx_server_action index when present on EmbedAction collection")
    void should_drop_obsolete_idx_server_action_when_present() {
        IndexInfo obsoleteIndex = mock(IndexInfo.class);
        when(obsoleteIndex.getName()).thenReturn("idx_server_action");

        when(interactionIndexOps.getIndexInfo()).thenReturn(List.of());
        when(dispatchIndexOps.getIndexInfo()).thenReturn(List.of());
        when(embedActionIndexOps.getIndexInfo()).thenReturn(List.of(obsoleteIndex));

        reconciliationConfig.run();

        verify(embedActionIndexOps).dropIndex("idx_server_action");
    }

    @Test
    @DisplayName("Should drop conflicting non-TTL index matching field name")
    void should_drop_conflicting_non_ttl_index_matching_name() {
        IndexInfo conflictingNameIndex = mock(IndexInfo.class);
        when(conflictingNameIndex.getName()).thenReturn("createdAt");
        when(conflictingNameIndex.isIndexForFields(List.of("createdAt"))).thenReturn(false);
        when(conflictingNameIndex.getExpireAfter()).thenReturn(Optional.empty());

        when(interactionIndexOps.getIndexInfo()).thenReturn(List.of(conflictingNameIndex));
        when(dispatchIndexOps.getIndexInfo()).thenReturn(List.of());

        reconciliationConfig.init();

        verify(interactionIndexOps).dropIndex("createdAt");
        verify(interactionIndexOps).ensureIndex(any(IndexDefinition.class));
    }

    @Test
    @DisplayName("MongoConfig post processor triggers early reconciliation for MongoTemplate")
    void mongoConfig_postProcessor_triggersReconciliation() {
        org.springframework.beans.factory.config.BeanPostProcessor postProcessor =
                MongoConfig.mongoTemplateIndexReconcilingPostProcessor();

        IndexInfo obsoleteIndex = mock(IndexInfo.class);
        when(obsoleteIndex.getName()).thenReturn("idx_server_action");

        when(interactionIndexOps.getIndexInfo()).thenReturn(List.of());
        when(dispatchIndexOps.getIndexInfo()).thenReturn(List.of());
        when(embedActionIndexOps.getIndexInfo()).thenReturn(List.of(obsoleteIndex));

        Object processedBean = postProcessor.postProcessAfterInitialization(mongoTemplate, "mongoTemplate");

        assertThat(processedBean).isSameAs(mongoTemplate);
        verify(embedActionIndexOps).dropIndex("idx_server_action");
    }
}
