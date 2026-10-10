package com.afuerta.riftbound.domain;

final class TickMath {
    private TickMath() {}

    static long deadline(long now, long delay) {
        if (now < 0 || delay < 0) throw new IllegalArgumentException("Ticks must be non-negative");
        return delay > Long.MAX_VALUE - now ? Long.MAX_VALUE : now + delay;
    }
}
