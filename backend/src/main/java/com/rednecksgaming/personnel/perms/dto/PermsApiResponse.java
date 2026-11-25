// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Proprietary API response envelope carrying numeric domain error codes for personnel permissions endpoints.
 *
 * @param <T> payload data type
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PermsApiResponse<T>(
        boolean success,
        Integer errorCode,
        String message,
        T data
) {
    public static <T> PermsApiResponse<T> ok(T data) {
        return new PermsApiResponse<>(true, null, null, data);
    }

    public static <T> PermsApiResponse<T> ok(String message, T data) {
        return new PermsApiResponse<>(true, null, message, data);
    }

    public static <T> PermsApiResponse<T> failure(int errorCode, String message) {
        return new PermsApiResponse<>(false, errorCode, message, null);
    }
}
