package com.rng;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RngApplicationUnitTest {

    @Test
    @DisplayName("RngApplication entrypoint instantiates properly")
    void application_instantiates() {
        RngApplication app = new RngApplication();
        assertThat(app).isNotNull();
    }
}
