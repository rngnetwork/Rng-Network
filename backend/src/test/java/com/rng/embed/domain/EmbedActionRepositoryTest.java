package com.rng.embed.domain;

import com.rng.embed.repository.EmbedActionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmbedActionRepositoryTest {

    @Mock
    private EmbedActionRepository repository;

    @Test
    @DisplayName("Should persist and retrieve EmbedAction by actionId and serverId")
    void testPersistAndRetrieve() {
        ActionPayload payload = ActionPayload.builder()
                .roleSubtype("TOGGLE")
                .roleId("987654321098765432")
                .roleName("Member")
                .successMessage("Role toggled successfully!")
                .build();

        EmbedAction action = EmbedAction.builder()
                .actionId("rng_act_a1b2c3d4e5f67890")
                .serverId("123456789012345678")
                .name("Member Role Toggle")
                .actionType(ActionType.ROLE)
                .payload(payload)
                .createdBy("admin@rng.com")
                .build();

        when(repository.save(any(EmbedAction.class))).thenReturn(action);
        when(repository.findByActionId("rng_act_a1b2c3d4e5f67890")).thenReturn(Optional.of(action));
        when(repository.findByServerIdAndActionId("123456789012345678", "rng_act_a1b2c3d4e5f67890")).thenReturn(Optional.of(action));
        when(repository.findByServerId("123456789012345678")).thenReturn(List.of(action));

        EmbedAction saved = repository.save(action);
        assertThat(saved).isNotNull();
        assertThat(saved.getActionId()).isEqualTo("rng_act_a1b2c3d4e5f67890");
        assertThat(saved.getActionType()).isEqualTo(ActionType.ROLE);
        assertThat(saved.getPayload().getRoleId()).isEqualTo("987654321098765432");

        Optional<EmbedAction> foundByActionId = repository.findByActionId("rng_act_a1b2c3d4e5f67890");
        assertThat(foundByActionId).isPresent();
        assertThat(foundByActionId.get().getName()).isEqualTo("Member Role Toggle");

        Optional<EmbedAction> foundByBoth = repository.findByServerIdAndActionId("123456789012345678", "rng_act_a1b2c3d4e5f67890");
        assertThat(foundByBoth).isPresent();
        assertThat(foundByBoth.get().getServerId()).isEqualTo("123456789012345678");

        List<EmbedAction> serverActions = repository.findByServerId("123456789012345678");
        assertThat(serverActions).hasSize(1);
    }
}
