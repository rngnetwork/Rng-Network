package com.rng.embed.service;

import com.rng.embed.domain.EmbedAction;
import com.rng.embed.dto.CreateActionRequest;
import com.rng.embed.dto.EmbedActionDto;
import com.rng.embed.dto.InteractionLogResponse;
import com.rng.embed.dto.UpdateActionRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

/**
 * Service managing Action Template registration, lifecycle, and Redis caching.
 */
public interface EmbedActionService {

    EmbedActionDto createAction(CreateActionRequest request);

    EmbedActionDto createAction(CreateActionRequest request, String operatorEmail);

    EmbedActionDto updateAction(String actionId, UpdateActionRequest request);

    EmbedActionDto updateAction(String actionId, UpdateActionRequest request, String operatorEmail);

    void deleteAction(String actionId);

    List<EmbedActionDto> getActionsForServer(String serverId);

    Page<EmbedActionDto> getActionsForServer(String serverId, Pageable pageable);

    List<EmbedActionDto> getGlobalActions();

    Optional<EmbedAction> resolveAction(String actionId);

    Page<InteractionLogResponse> getInteractionLogs(String guildId, Pageable pageable);
}
