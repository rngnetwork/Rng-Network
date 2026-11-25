// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.controller;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Registers {@link GranularPermissionsInterceptor} across all {@code /api/v1/**} endpoints.
 */
@Configuration
public class PermsWebMvcConfig implements WebMvcConfigurer {

    private final GranularPermissionsInterceptor granularPermissionsInterceptor;

    public PermsWebMvcConfig(GranularPermissionsInterceptor granularPermissionsInterceptor) {
        this.granularPermissionsInterceptor = granularPermissionsInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(granularPermissionsInterceptor)
                .addPathPatterns("/api/v1/**");
    }
}
