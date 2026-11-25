// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class AdditiveUnionResolverTest {

    private final AdditiveUnionResolver resolver = new AdditiveUnionResolver();

    @Test
    @DisplayName("Returns empty mutable map when input permission trees are null or empty")
    void shouldReturnEmptyMapWhenEmptyOrNull() {
        assertThat(resolver.computeUnion(null)).isEmpty();
        assertThat(resolver.computeUnion(Collections.emptyList())).isEmpty();
        assertThat(resolver.computeUnion(Arrays.asList(null, Map.of()))).isEmpty();
    }

    @Test
    @DisplayName("Computes commutative Boolean OR union across multi-role immutable nested maps")
    void shouldComputeBooleanOrUnionAcrossMultipleRoles() {
        Map<String, Object> juniorDevRole = Map.of(
                "dashboard", Map.of("enabled", true),
                "dashboard.embeds", Map.of("enabled", false),
                "dashboard.botconfig", Map.of("enabled", false),
                "dashboard.servers", Map.of(
                        "enabled", true,
                        "dashboard.servers.[serverId]", Map.of(
                                "rednecks-gaming", Map.of(
                                        "enabled", true,
                                        "embeds", false,
                                        "settings", false
                                )
                        )
                ),
                "dashboard.whitelist", Map.of("enabled", false, "fullAccess", false)
        );

        Map<String, Object> secretaryRole = Map.of(
                "dashboard", Map.of("enabled", false),
                "dashboard.embeds", Map.of("enabled", true),
                "dashboard.botconfig", Map.of("enabled", false),
                "dashboard.servers", Map.of(
                        "enabled", false,
                        "dashboard.servers.[serverId]", Map.of(
                                "rednecks-gaming", Map.of(
                                        "enabled", false,
                                        "embeds", true,
                                        "settings", false
                                ),
                                "rednecks-admin", Map.of(
                                        "enabled", true
                                )
                        )
                ),
                "dashboard.whitelist", Map.of("enabled", true, "fullAccess", false)
        );

        Map<String, Object> forwardUnion = resolver.computeUnion(List.of(juniorDevRole, secretaryRole));
        Map<String, Object> reverseUnion = resolver.computeUnion(List.of(secretaryRole, juniorDevRole));

        assertThat(forwardUnion).isEqualTo(reverseUnion);
        assertThat(extractBool(forwardUnion, "dashboard", "enabled")).isTrue();
        assertThat(extractBool(forwardUnion, "dashboard.embeds", "enabled")).isTrue();
        assertThat(extractBool(forwardUnion, "dashboard.botconfig", "enabled")).isFalse();
        assertThat(extractBool(forwardUnion, "dashboard.servers", "enabled")).isTrue();
        assertThat(extractBool(forwardUnion, "dashboard.servers", "dashboard.servers.[serverId]", "rednecks-gaming", "enabled")).isTrue();
        assertThat(extractBool(forwardUnion, "dashboard.servers", "dashboard.servers.[serverId]", "rednecks-gaming", "embeds")).isTrue();
        assertThat(extractBool(forwardUnion, "dashboard.servers", "dashboard.servers.[serverId]", "rednecks-gaming", "settings")).isFalse();
        assertThat(extractBool(forwardUnion, "dashboard.servers", "dashboard.servers.[serverId]", "rednecks-admin", "enabled")).isTrue();
        assertThat(extractBool(forwardUnion, "dashboard.whitelist", "enabled")).isTrue();
        assertThat(extractBool(forwardUnion, "dashboard.whitelist", "fullAccess")).isFalse();
    }

    @Test
    @DisplayName("Enforces MAX_DEPTH=6 recursion cap without stack overflow")
    void shouldCapRecursionAtMaxDepthSix() {
        Map<String, Object> depth7 = Map.of("l7", Map.of("enabled", true));
        Map<String, Object> depth6 = Map.of("l6", depth7);
        Map<String, Object> depth5 = Map.of("l5", depth6);
        Map<String, Object> depth4 = Map.of("l4", depth5);
        Map<String, Object> depth3 = Map.of("l3", depth4);
        Map<String, Object> depth2 = Map.of("l2", depth3);
        Map<String, Object> depth1 = Map.of("l1", depth2);

        assertThatCode(() -> {
            Map<String, Object> result = resolver.computeUnion(List.of(depth1));
            Object l6 = extractPath(result, "l1", "l2", "l3", "l4", "l5", "l6");
            assertThat(l6).isInstanceOfSatisfying(Map.class, l6Map ->
                    assertThat(l6Map.containsKey("l7")).isFalse()
            );
        }).doesNotThrowAnyException();
    }

    private Object extractPath(Map<String, Object> root, String... keys) {
        Object current = root;
        for (String key : keys) {
            if (!(current instanceof Map<?, ?> map)) {
                return null;
            }
            current = map.get(key);
        }
        return current;
    }

    private boolean extractBool(Map<String, Object> root, String... keys) {
        Object value = extractPath(root, keys);
        assertThat(value).isInstanceOf(Boolean.class);
        return (Boolean) value;
    }
}
