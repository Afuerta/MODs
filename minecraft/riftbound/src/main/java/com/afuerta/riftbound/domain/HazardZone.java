package com.afuerta.riftbound.domain;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/** Immutable horizontal telegraph geometry in coordinates relative to the anchor. */
public record HazardZone(Aspect aspect, double focusX, double focusZ, double angle) {
    public static final double ARENA_RADIUS = 24;
    public static final double ROOT_RADIUS = 3;
    public static final double STRIP_HALF_WIDTH = 1.5;
    public static final double STRIP_OFFSET = 6;
    public static final double TIDAL_INNER_RADIUS = 6;
    public static final double TIDAL_OUTER_RADIUS = 18;
    public record Point(double x, double z) {}

    public HazardZone {
        Objects.requireNonNull(aspect, "aspect");
        if (!Double.isFinite(focusX) || !Double.isFinite(focusZ) || !Double.isFinite(angle)) {
            throw new IllegalArgumentException("Zone coordinates must be finite");
        }
        double length = Math.hypot(focusX, focusZ);
        if (length > 18) { focusX *= 18 / length; focusZ *= 18 / length; }
    }

    public static HazardZone create(Aspect aspect, long seed, int pulse, double focusX, double focusZ) {
        if (pulse < 1) throw new IllegalArgumentException("Pulse must be positive");
        long mixed = seed ^ (pulse * 0x9E3779B97F4A7C15L);
        mixed = (mixed ^ (mixed >>> 30)) * 0xBF58476D1CE4E5B9L;
        double angle = Long.remainderUnsigned(mixed ^ (mixed >>> 27), 8) * Math.PI / 8;
        return new HazardZone(aspect, focusX, focusZ, angle);
    }

    /** All zones stay within the arena; height and participant eligibility are adapter checks. */
    public boolean contains(double x, double z) {
        if (!Double.isFinite(x) || !Double.isFinite(z) || x * x + z * z > ARENA_RADIUS * ARENA_RADIUS) return false;
        double perpendicular = -x * Math.sin(angle) + z * Math.cos(angle);
        return switch (aspect) {
            case VERDANT -> Math.hypot(x - focusX, z - focusZ) <= ROOT_RADIUS;
            case EMBER -> Math.abs(Math.abs(perpendicular) - STRIP_OFFSET) <= STRIP_HALF_WIDTH;
            case TIDAL -> Math.hypot(x, z) >= TIDAL_INNER_RADIUS && Math.hypot(x, z) <= TIDAL_OUTER_RADIUS;
            case HOLLOW -> Math.abs(perpendicular) <= STRIP_HALF_WIDTH;
        };
    }

    /** Bounded particle markers sampled from exactly the same geometry used by impacts. */
    public List<Point> markers() {
        List<Point> points = new ArrayList<>();
        for (int x = -24; x <= 24; x += 2) {
            for (int z = -24; z <= 24; z += 2) {
                if (contains(x, z) && (!contains(x - 2, z) || !contains(x + 2, z)
                        || !contains(x, z - 2) || !contains(x, z + 2))) points.add(new Point(x, z));
            }
        }
        return List.copyOf(points);
    }
}
