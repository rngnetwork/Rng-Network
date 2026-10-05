package com.rng.embed.config;

import com.rng.embed.domain.DispatchLog;
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

    @InjectMocks
    private MongoIndexReconciliationConfig reconciliationConfig;

    @BeforeEach
    void setUp() {
        lenient().when(mongoTemplate.indexOps(InteractionLog.class)).thenReturn(interactionIndexOps);
        lenient().when(mongoTemplate.indexOps(DispatchLog.class)).thenReturn(dispatchIndexOps);
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
}
