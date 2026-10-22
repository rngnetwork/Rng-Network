package com.rednecksgaming.common.exception;

import com.rednecksgaming.common.dto.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("handleUnauthorized maps UnauthorizedException to 401 UNAUTHORIZED")
    void handleUnauthorized_mapsTo401() {
        UnauthorizedException ex = new UnauthorizedException("Invalid token credentials");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleUnauthorized(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Invalid token credentials");
    }

    @Test
    @DisplayName("handleSpringAuthenticationException maps AuthenticationException to 401 UNAUTHORIZED")
    void handleSpringAuthenticationException_mapsTo401() {
        AuthenticationException ex = new DisabledException("Account is disabled");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleSpringAuthenticationException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Authentication failed: Account is disabled");
    }

    @Test
    @DisplayName("handleForbidden maps ForbiddenException to 403 FORBIDDEN")
    void handleForbidden_mapsTo403() {
        ForbiddenException ex = new ForbiddenException("Higher ministry clearance required");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleForbidden(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Higher ministry clearance required");
    }

    @Test
    @DisplayName("handleAccessDenied maps AccessDeniedException to 403 FORBIDDEN with standard message")
    void handleAccessDenied_mapsTo403() {
        AccessDeniedException ex = new AccessDeniedException("Forbidden");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleAccessDenied(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Access denied: insufficient permissions");
    }

    @Test
    @DisplayName("handleNotFound maps ResourceNotFoundException to 404 NOT_FOUND")
    void handleNotFound_mapsTo404() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Guild not found: 12345");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleNotFound(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Guild not found: 12345");
    }

    @Test
    @DisplayName("handleConflict maps ConflictException to 409 CONFLICT")
    void handleConflict_mapsTo409() {
        ConflictException ex = new ConflictException("Template optimistic lock conflict");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleConflict(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Template optimistic lock conflict");
    }

    @Test
    @DisplayName("handleBadCredentials maps BadCredentialsException to 401 UNAUTHORIZED")
    void handleBadCredentials_mapsTo401() {
        BadCredentialsException ex = new BadCredentialsException("Invalid password for operator");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleBadCredentials(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Invalid password for operator");
    }

    @Test
    @DisplayName("handleValidationErrors maps MethodArgumentNotValidException to 400 with field errors map")
    void handleValidationErrors_mapsTo400WithErrorsMap() throws NoSuchMethodException {
        Object target = new Object();
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(target, "testObject");
        bindingResult.addError(new FieldError("testObject", "name", "Template name cannot be blank"));
        bindingResult.addError(new FieldError("testObject", "payload", "Discord V2 payload is mandatory"));

        MethodParameter parameter = new MethodParameter(
                GlobalExceptionHandlerTest.class.getDeclaredMethod("setUp"), -1);
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(parameter, bindingResult);

        ResponseEntity<ApiResponse<Map<String, String>>> response = exceptionHandler.handleValidationErrors(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Validation failed");
        assertThat(response.getBody().getData()).containsEntry("name", "Template name cannot be blank");
        assertThat(response.getBody().getData()).containsEntry("payload", "Discord V2 payload is mandatory");
    }

    @Test
    @DisplayName("handleIllegalArgument maps IllegalArgumentException to 400 BAD_REQUEST")
    void handleIllegalArgument_mapsTo400() {
        IllegalArgumentException ex = new IllegalArgumentException("Action type cannot be null");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleIllegalArgument(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Action type cannot be null");
    }

    @Test
    @DisplayName("handleBadRequest maps BadRequestException to 400 BAD_REQUEST")
    void handleBadRequest_mapsTo400() {
        BadRequestException ex = new BadRequestException("Malformed Discord payload");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleBadRequest(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Malformed Discord payload");
    }

    @Test
    @DisplayName("handleInternalServerException maps InternalServerException to 500 INTERNAL_SERVER_ERROR")
    void handleInternalServerException_mapsTo500() {
        InternalServerException ex = new InternalServerException("Redis script execution error");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleInternalServerException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Redis script execution error");
    }

    @Test
    @DisplayName("handleServiceUnavailable maps ServiceUnavailableException to 503 SERVICE_UNAVAILABLE")
    void handleServiceUnavailable_mapsTo503() {
        ServiceUnavailableException ex = new ServiceUnavailableException("Discord Gateway WebSocket is disconnected");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleServiceUnavailable(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage()).isEqualTo("Discord Gateway WebSocket is disconnected");
    }

    @Test
    @DisplayName("handleGenericException maps unhandled Exception to 500 INTERNAL_SERVER_ERROR with generic message")
    void handleGenericException_mapsTo500WithSafeMessage() {
        NullPointerException ex = new NullPointerException("Null pointer in pipeline");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleGenericException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getMessage())
                .isEqualTo("An internal server error occurred. Please try again later.");
    }
}
