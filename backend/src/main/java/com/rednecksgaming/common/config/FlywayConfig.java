// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.common.config;

import org.flywaydb.core.api.configuration.FluentConfiguration;
import org.springframework.boot.flyway.autoconfigure.FlywayConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {

    @Bean
    public FlywayConfigurationCustomizer customFlywayConfig() {
        return (FluentConfiguration configuration) -> {
            configuration
                .connectRetries(5)
                .loggers("slf4j");
        };
    }
}
