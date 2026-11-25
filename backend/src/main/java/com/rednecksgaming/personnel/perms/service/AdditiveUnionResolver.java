// Written By: RachitSWE
// LICENSE: All rights reserved
// Year: 2026
package com.rednecksgaming.personnel.perms.service;

import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

/**
 * Computes the additive Boolean OR union across multiple role permission JSONB trees.
 * Compiles cleanly without {@code @SuppressWarnings} via strict pattern-matching traversal.
 */
@Component
public class AdditiveUnionResolver {

    private static final int MAX_DEPTH = 6;

    /**
     * Merges a collection of role permission maps using additive Boolean OR semantics:
     * {@code P_eff(k) = OR_{r in Roles} P_r(k)}.
     *
     * @param permissionTrees collection of per-role JSONB permission trees
     * @return deep mutable union map safe for serialization and downstream mutation
     */
    public Map<String, Object> computeUnion(Collection<Map<String, Object>> permissionTrees) {
        if (permissionTrees == null || permissionTrees.isEmpty()) {
            return new HashMap<>();
        }

        Map<String, Object> unionResult = new HashMap<>();
        for (Map<String, Object> tree : permissionTrees) {
            if (tree == null || tree.isEmpty()) {
                continue;
            }
            mergeInto(unionResult, tree, 1);
        }
        return unionResult;
    }

    private void mergeInto(Map<String, Object> target, Map<?, ?> source, int depth) {
        if (depth > MAX_DEPTH) {
            return;
        }

        for (Map.Entry<?, ?> entry : source.entrySet()) {
            if (!(entry.getKey() instanceof String key)) {
                continue;
            }
            Object sourceVal = entry.getValue();

            if (sourceVal instanceof Boolean b) {
                Object existing = target.get(key);
                if (existing instanceof Boolean exB) {
                    target.put(key, exB || b);
                } else {
                    target.put(key, b);
                }
            } else if (sourceVal instanceof Map<?, ?> sourceMap) {
                Object existing = target.get(key);
                Map<String, Object> targetChildMap;
                if (existing instanceof Map<?, ?> exMap) {
                    targetChildMap = cloneToMutableStringMap(exMap, depth + 1);
                } else {
                    targetChildMap = new HashMap<>();
                }
                target.put(key, targetChildMap);
                mergeInto(targetChildMap, sourceMap, depth + 1);
            } else if (sourceVal != null) {
                target.putIfAbsent(key, sourceVal);
            }
        }
    }

    private Map<String, Object> cloneToMutableStringMap(Map<?, ?> input, int depth) {
        if (depth > MAX_DEPTH) {
            return new HashMap<>();
        }
        Map<String, Object> mutable = new HashMap<>();
        for (Map.Entry<?, ?> entry : input.entrySet()) {
            if (!(entry.getKey() instanceof String key) || entry.getValue() == null) {
                continue;
            }
            Object value = entry.getValue();
            if (value instanceof Map<?, ?> nestedMap) {
                mutable.put(key, cloneToMutableStringMap(nestedMap, depth + 1));
            } else {
                mutable.put(key, value);
            }
        }
        return mutable;
    }
}
