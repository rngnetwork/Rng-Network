package com.rng.api.controller;

import com.rng.common.dto.ApiResponse;
import com.rng.server.dto.DiscordChannelDto;
import com.rng.server.dto.ServerDetailDto;
import com.rng.server.dto.ServerListItemDto;
import com.rng.server.dto.UpdateServerSettingsRequest;
import com.rng.server.service.ServerService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServerControllerUnitTest {

    @Mock
    private ServerService serverService;

    @InjectMocks
    private ServerController serverController;

    @Test
    @DisplayName("getAllServers returns 200 OK with list of servers")
    void getAllServers_success() {
        ServerListItemDto item = ServerListItemDto.builder().id("123").name("RNG Main").build();
        when(serverService.getAllServers()).thenReturn(List.of(item));

        ResponseEntity<ApiResponse<List<ServerListItemDto>>> response = serverController.getAllServers();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData()).hasSize(1);
    }

    @Test
    @DisplayName("getServerDetails resolves server by ID/slug and returns 200 OK")
    void getServerDetails_success() {
        ServerDetailDto detail = ServerDetailDto.builder().id("123").slug("rng-main").build();
        when(serverService.getServerByIdOrSlug("rng-main")).thenReturn(detail);

        ResponseEntity<ApiResponse<ServerDetailDto>> response = serverController.getServerDetails("rng-main");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().getSlug()).isEqualTo("rng-main");
    }

    @Test
    @DisplayName("getServerChannels returns 200 OK with channel list")
    void getServerChannels_success() {
        DiscordChannelDto channel = DiscordChannelDto.builder().id("c1").name("general").build();
        when(serverService.getServerChannels("123")).thenReturn(List.of(channel));

        ResponseEntity<ApiResponse<List<DiscordChannelDto>>> response = serverController.getServerChannels("123");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData()).hasSize(1);
    }

    @Test
    @DisplayName("updateServerSettings mutates server and returns 200 OK with updated detail")
    void updateServerSettings_success() {
        UpdateServerSettingsRequest request = UpdateServerSettingsRequest.builder().name("New Name").build();
        ServerDetailDto updated = ServerDetailDto.builder().id("123").name("New Name").build();

        when(serverService.updateServerSettings(10L, "123", request)).thenReturn(updated);

        ResponseEntity<ApiResponse<ServerDetailDto>> response = serverController.updateServerSettings(10L, "123", request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().getName()).isEqualTo("New Name");
    }
}
