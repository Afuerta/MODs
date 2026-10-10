package com.afuerta.convergence.domain;

import java.util.List;

/** A fixed-position, bounded station catalog; earned trophies and catalysts are never manufactured. */
public final class InfusionCatalog {
    public static final int INPUTS = 7;
    public static final int DURATION = 200;
    public record Ingredient(String item, int count) {
        public Ingredient {
            if (item == null || !item.matches("[a-z_]+:[a-z_]+") || count < 1 || count > 64)
                throw new IllegalArgumentException("Invalid infusion ingredient");
        }
    }
    public record Infusion(String id, List<Ingredient> ingredients, String output) {
        public Infusion {
            ingredients = java.util.Collections.unmodifiableList(new java.util.ArrayList<>(ingredients));
            if (ingredients.size() != INPUTS || ingredients.get(3) == null
                    || !ingredients.get(3).item().equals("convergence:concordance")
                    || !output.startsWith("convergence:")
                    || ingredients.stream().filter(java.util.Objects::nonNull).anyMatch(i -> i.item().equals(output)))
                throw new IllegalArgumentException("Invalid infusion economy");
        }
    }
    private static final List<Infusion> RECIPES = List.of(
            recipe("verdant_lens", "verdant_echo", "memory_glass", 2, 1, 1, 1, 0, 2, "astral_lens"),
            recipe("tidal_sigil", "tidal_echo", "charged_core", 2, 2, 2, 0, 1, 1, "stormward_sigil"),
            recipe("hollow_harness", "hollow_echo", "brass_gear", 2, 2, 1, 2, 1, 2, "expedition_harness"),
            recipe("ember_mender", "ember_echo", "brass_gear", 2, 1, 1, 1, 0, 2, "mender_coil"));

    private static Infusion recipe(String id, String echo, String copper, int copperCount, int steelCount,
                                   int trophies, int focuses, int matrices, int filaments, String output) {
        return new Infusion(id, java.util.Arrays.asList(new Ingredient("riftbound:" + echo, 2),
                new Ingredient("copperwake:" + copper, copperCount), new Ingredient("starfall:starsteel_ingot", steelCount),
                new Ingredient("convergence:concordance", trophies), focuses == 0 ? null : new Ingredient("convergence:tempered_focus", focuses),
                matrices == 0 ? null : new Ingredient("convergence:harmonic_matrix", matrices),
                new Ingredient("convergence:confluence_filament", filaments)), "convergence:" + output);
    }
    public static List<Infusion> all() { return RECIPES; }
    public static boolean accepts(int slot, String item) {
        if (slot < 0 || slot >= INPUTS) return false;
        return RECIPES.stream().map(recipe -> recipe.ingredients().get(slot))
                .filter(java.util.Objects::nonNull).anyMatch(ingredient -> ingredient.item().equals(item));
    }
    private InfusionCatalog() { }
}
