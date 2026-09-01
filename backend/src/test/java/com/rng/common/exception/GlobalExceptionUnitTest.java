package com.rng.common.exception;

import com.rng.common.dto.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionUnitTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("Maps UnauthorizedException to 401 UNAUTHORIZED ApiResponse")
    void handleUnauthorized_returns401() {
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleUnauthorized(
                new UnauthorizedException("Token has expired")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Token has expired");
    }

    @Test
    @DisplayName("Maps BadCredentialsException to 401 UNAUTHORIZED ApiResponse")
    void handleBadCredentials_returns401() {
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleBadCredentials(
                new BadCredentialsException("Invalid password")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Invalid password");
    }

    @Test
    @DisplayName("Maps ForbiddenException to 403 FORBIDDEN ApiResponse")
    void handleForbidden_returns403() {
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleForbidden(
                new ForbiddenException("Access denied to ministry")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Access denied to ministry");
    }

    @Test
    @DisplayName("Maps AccessDeniedException to 403 FORBIDDEN ApiResponse")
    void handleAccessDenied_returns403() {
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleAccessDenied(
                new AccessDeniedException("Forbidden")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).contains("insufficient permissions");
    }

    @Test
    @DisplayName("Maps ResourceNotFoundException to 404 NOT_FOUND ApiResponse")
    void handleNotFound_returns404() {
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleNotFound(
                new ResourceNotFoundException("Server 123 not found")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Server 123 not found");
    }

    @Test
    @DisplayName("Maps ConflictException to 409 CONFLICT ApiResponse")
    void handleConflict_returns409() {
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleConflict(
                new ConflictException("Email already exists")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Email already exists");
    }

    @Test
    @DisplayName("Maps IllegalArgumentException to 400 BAD_REQUEST ApiResponse")
    void handleIllegalArgument_returns400() {
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleIllegalArgument(
                new IllegalArgumentException("Invalid designation")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Invalid designation");
    }

    @Test
    @DisplayName("Maps ServiceUnavailableException to 503 SERVICE_UNAVAILABLE ApiResponse")
    void handleServiceUnavailable_returns503() {
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleServiceUnavailable(
                new ServiceUnavailableException("Discord gateway unreachable")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Discord gateway unreachable");
    }

    @Test
    @DisplayName("Maps MethodArgumentNotValidException to 400 BAD_REQUEST with field error map")
    void handleValidationErrors_returns400WithFieldMap() throws NoSuchMethodException {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "target");
        bindingResult.addError(new FieldError("target", "email", "must not be blank"));
        bindingResult.addError(new FieldError("target", "password", "must be at least 8 characters"));

        MethodParameter parameter = new MethodParameter(
                GlobalExceptionUnitTest.class.getDeclaredMethod("dummyMethod"), -1
        );
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(parameter, bindingResult);

        ResponseEntity<ApiResponse<Map<String, String>>> response = exceptionHandler.handleValidationErrors(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Validation failed");
        assertThat(response.getBody().getData())
                .containsEntry("email", "must not be blank")
                .containsEntry("password", "must be at least 8 characters");
    }

    @Test
    @DisplayName("Maps DataIntegrityViolationException to 409 CONFLICT")
    void handleDataIntegrityViolation_returns409() {
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleDataIntegrityViolation(
                new org.springframework.dao.DataIntegrityViolationException("duplicate key value violates unique constraint")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).contains("Resource conflict");
    }

    @Test
    @DisplayName("Maps generic unhandled Exception to 500 INTERNAL_SERVER_ERROR")
    void handleGenericException_returns500() {
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleGenericException(
                new RuntimeException("Unexpected database glitch")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).contains("An internal server error occurred");
    }

    public void dummyMethod() {}
}
