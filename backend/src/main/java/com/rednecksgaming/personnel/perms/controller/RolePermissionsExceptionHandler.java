// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.controller;

import com.rednecksgaming.personnel.perms.dto.PermsApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.NoSuchElementException;

/**
 * Translates domain and validation exceptions thrown by {@link RolePermissionsController}
 * into the proprietary {@link PermsApiResponse} envelope with numeric error codes (1001-1005).
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = RolePermissionsController.class)
public class RolePermissionsExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(RolePermissionsExceptionHandler.class);

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<PermsApiResponse<Void>> handleOptimisticLock(OptimisticLockingFailureException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(PermsApiResponse.failure(1001, ex.getMessage()));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<PermsApiResponse<Void>> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(PermsApiResponse.failure(1002, ex.getMessage()));
    }

    @ExceptionHandler({AccessDeniedException.class, SecurityException.class})
    public ResponseEntity<PermsApiResponse<Void>> handleAccessDenied(Exception ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(PermsApiResponse.failure(1003, ex.getMessage()));
    }

    @ExceptionHandler({
            MethodArgumentNotValidException.class,
            ConstraintViolationException.class,
            IllegalArgumentException.class
    })
    public ResponseEntity<PermsApiResponse<Void>> handleValidation(Exception ex) {
        String message = "Invalid request payload";
        if (ex instanceof MethodArgumentNotValidException manv
                && manv.getBindingResult().hasFieldErrors()
                && manv.getBindingResult().getFieldError() != null) {
            message = manv.getBindingResult().getFieldError().getDefaultMessage();
        } else if (ex.getMessage() != null && !ex.getMessage().isBlank()) {
            message = ex.getMessage();
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(PermsApiResponse.failure(1004, message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<PermsApiResponse<Void>> handleGeneral(Exception ex) {
        log.error("Unhandled personnel permissions error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(PermsApiResponse.failure(1005, "Internal system error"));
    }
}
