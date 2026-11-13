// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.embed.service;

import com.rednecksgaming.embed.domain.EmbedAction;
import com.rednecksgaming.embed.dto.CreateActionRequest;
import com.rednecksgaming.embed.dto.EmbedActionDto;
import com.rednecksgaming.embed.dto.InteractionLogResponse;
import com.rednecksgaming.embed.dto.UpdateActionRequest;
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

    List<EmbedActionDto> getAllActions();

    Optional<EmbedAction> resolveAction(String actionId);

    Page<InteractionLogResponse> getInteractionLogs(String guildId, Pageable pageable);
}
