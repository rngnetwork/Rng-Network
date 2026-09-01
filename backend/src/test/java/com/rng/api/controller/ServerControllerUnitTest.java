package com.rng.api.controller;

import com.rng.common.dto.ApiResponse;
import com.rng.identity.domain.User;
import com.rng.identity.repository.UserRepository;
import com.rng.server.dto.ChannelDto;
import com.rng.server.dto.ServerDetailDto;
import com.rng.server.dto.ServerDto;
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
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServerControllerUnitTest {

    @Mock
    private ServerService serverService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ServerController serverController;

    @Test
    @DisplayName("getAllServers returns 200 OK with list of servers")
    void getAllServers_success() {
        ServerDto item = ServerDto.builder().id("123").name("RNG Main").build();
        when(serverService.getAllServers()).thenReturn(List.of(item));

        ResponseEntity<ApiResponse<List<ServerDto>>> response = serverController.getAllServers();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData()).hasSize(1);
    }

    @Test
    @DisplayName("getServerDetails resolves server by ID/slug and returns 200 OK")
    void getServerDetails_success() {
        ServerDetailDto detail = ServerDetailDto.builder().id("123").slug("rng-main").build();
        when(serverService.getServerDetails("rng-main")).thenReturn(detail);

        ResponseEntity<ApiResponse<ServerDetailDto>> response = serverController.getServerDetails("rng-main");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().getSlug()).isEqualTo("rng-main");
    }

    @Test
    @DisplayName("getServerChannels returns 200 OK with channel list")
    void getServerChannels_success() {
        ChannelDto channel = ChannelDto.builder().id("c1").name("general").build();
        when(serverService.getServerChannels("123")).thenReturn(List.of(channel));

        ResponseEntity<ApiResponse<List<ChannelDto>>> response = serverController.getServerChannels("123");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData()).hasSize(1);
    }

    @Test
    @DisplayName("updateServerSettings mutates server with authenticated operator and returns 200 OK")
    void updateServerSettings_withAuth_success() {
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(10L);

        User user = User.builder().id(10L).email("admin@rng.com").build();
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));

        UpdateServerSettingsRequest request = UpdateServerSettingsRequest.builder().name("New Name").build();
        ServerDetailDto updated = ServerDetailDto.builder().id("123").name("New Name").build();

        when(serverService.updateServerSettings("123", request, "admin@rng.com")).thenReturn(updated);

        ResponseEntity<ApiResponse<ServerDetailDto>> response = serverController.updateServerSettings(auth, "123", request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().getName()).isEqualTo("New Name");
    }

    @Test
    @DisplayName("updateServerSettings defaults operator to system when authentication is null")
    void updateServerSettings_nullAuth_defaultsToSystem() {
        UpdateServerSettingsRequest request = UpdateServerSettingsRequest.builder().name("New Name").build();
        ServerDetailDto updated = ServerDetailDto.builder().id("123").name("New Name").build();

        when(serverService.updateServerSettings("123", request, "system@rng.com")).thenReturn(updated);

        ResponseEntity<ApiResponse<ServerDetailDto>> response = serverController.updateServerSettings(null, "123", request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().getName()).isEqualTo("New Name");
    }
}
