package com.rng.api.controller;

import com.rng.common.dto.ApiResponse;
import com.rng.identity.dto.UserResponse;
import com.rng.identity.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserControllerUnitTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private UserController userController;

    @Test
    @DisplayName("getCurrentUser returns 200 OK with authenticated user profile")
    void getCurrentUser_success() {
        UserResponse userResponse = UserResponse.builder()
                .id(10L)
                .email("user@rng.com")
                .role("ROLE_HIGH_COMMAND")
                .build();

        when(authService.getCurrentUser(10L)).thenReturn(userResponse);

        ResponseEntity<ApiResponse<UserResponse>> response = userController.getCurrentUser(10L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getEmail()).isEqualTo("user@rng.com");
    }
}
