package com.rng.api.controller;

import com.rng.common.dto.ApiResponse;
import com.rng.identity.dto.UpdateWhitelistedUserRequest;
import com.rng.identity.dto.WhitelistUserRequest;
import com.rng.identity.dto.WhitelistedUserDto;
import com.rng.identity.service.WhitelistService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WhitelistControllerUnitTest {

    @Mock
    private WhitelistService whitelistService;

    @InjectMocks
    private WhitelistController whitelistController;

    @Test
    @DisplayName("getWhitelistedUsers returns 200 OK with list of DTOs")
    void getWhitelistedUsers_success() {
        WhitelistedUserDto dto = WhitelistedUserDto.builder().id(1L).email("user@rng.com").build();
        when(whitelistService.getWhitelistedUsers(10L)).thenReturn(List.of(dto));

        ResponseEntity<ApiResponse<List<WhitelistedUserDto>>> response = whitelistController.getWhitelistedUsers(10L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData()).hasSize(1);
        assertThat(response.getBody().getData().getFirst().getEmail()).isEqualTo("user@rng.com");
    }

    @Test
    @DisplayName("createWhitelistedUser returns 201 CREATED with created DTO")
    void createWhitelistedUser_success() {
        WhitelistUserRequest request = WhitelistUserRequest.builder().email("new@rng.com").build();
        WhitelistedUserDto createdDto = WhitelistedUserDto.builder().id(2L).email("new@rng.com").build();

        when(whitelistService.createWhitelistedUser(10L, request)).thenReturn(createdDto);

        ResponseEntity<ApiResponse<WhitelistedUserDto>> response = whitelistController.createWhitelistedUser(10L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getData().getEmail()).isEqualTo("new@rng.com");
    }

    @Test
    @DisplayName("updateWhitelistedUser returns 200 OK with updated DTO")
    void updateWhitelistedUser_success() {
        UpdateWhitelistedUserRequest request = UpdateWhitelistedUserRequest.builder().userName("Updated").build();
        WhitelistedUserDto updatedDto = WhitelistedUserDto.builder().id(2L).userName("Updated").build();

        when(whitelistService.updateWhitelistedUser(10L, 2L, request)).thenReturn(updatedDto);

        ResponseEntity<ApiResponse<WhitelistedUserDto>> response = whitelistController.updateWhitelistedUser(10L, 2L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().getUserName()).isEqualTo("Updated");
    }

    @Test
    @DisplayName("deleteWhitelistedUser returns 200 OK")
    void deleteWhitelistedUser_success() {
        ResponseEntity<ApiResponse<Void>> response = whitelistController.deleteWhitelistedUser(10L, 2L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(whitelistService).deleteWhitelistedUser(10L, 2L);
    }

    @Test
    @DisplayName("getPersonnelHierarchy returns 200 OK with full hierarchy map")
    void getPersonnelHierarchy_success() {
        ResponseEntity<ApiResponse<Map<String, List<String>>>> response = whitelistController.getPersonnelHierarchy();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData()).containsKey("Supreme");
        assertThat(response.getBody().getData()).containsKey("Ministry of Tech");
    }
}
