package com.afuerta.copperwake.domain;

import java.util.Collections;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;
import java.util.regex.Pattern;

/** Immutable server-owned contract definition; item keys are registry identifiers. */
public record SalvageContract(
        String id,
        String title,
        String description,
        Map<String, Integer> requirements,
        Map<String, Integer> rewards) {

    private static final Pattern IDENTIFIER = Pattern.compile("[a-z0-9_.-]+:[a-z0-9_/.-]+");
    private static final Set<String> CUSTOM_ITEMS = Set.of(
            "copperwake:scrap", "copperwake:brass_gear", "copperwake:memory_glass",
            "copperwake:charged_core", "copperwake:foreman_heart");

    public SalvageContract {
        id = nonBlank(id, "id");
        if (!IDENTIFIER.matcher(id).matches()) {
            throw new IllegalArgumentException("Invalid contract identifier: " + id);
        }
        title = nonBlank(title, "title");
        description = nonBlank(description, "description");
        requirements = checkedItems(requirements, "requirements");
        rewards = checkedItems(rewards, "rewards");
        for (String item : requirements.keySet()) {
            if (rewards.containsKey(item)) {
                throw new IllegalArgumentException("A contract cannot require and reward " + item);
            }
        }
    }

    private static String nonBlank(String value, String field) {
        Objects.requireNonNull(value, field);
        if (value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value;
    }

    private static Map<String, Integer> checkedItems(Map<String, Integer> items, String field) {
        Objects.requireNonNull(items, field);
        if (items.isEmpty()) {
            throw new IllegalArgumentException(field + " must not be empty");
        }
        // Sort registry keys so display order stays deterministic regardless of the caller's map.
        Map<String, Integer> result = new TreeMap<>();
        for (Map.Entry<String, Integer> entry : items.entrySet()) {
            String item = Objects.requireNonNull(entry.getKey(), field + " item");
            Integer count = Objects.requireNonNull(entry.getValue(), field + " count");
            if (!IDENTIFIER.matcher(item).matches()) {
                throw new IllegalArgumentException("Invalid item identifier: " + item);
            }
            if (item.startsWith("copperwake:") && !CUSTOM_ITEMS.contains(item)) {
                throw new IllegalArgumentException("Unregistered Copperwake item: " + item);
            }
            if (count <= 0 || count > 64) {
                throw new IllegalArgumentException("Contract item count must be between 1 and 64: " + item);
            }
            result.put(item, count);
        }
        return Collections.unmodifiableMap(result);
    }
}
