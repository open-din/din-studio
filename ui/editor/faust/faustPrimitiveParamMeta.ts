/**
 * Single source of truth for Faust MVP hslider bounds (must match {@link faustCodegen} emit*).
 */

export const FAUST_OSC_FREQUENCY = {
    min: 20,
    max: 20000,
    step: 0.01,
} as const;

export const FAUST_GAIN = {
    min: 0,
    max: 4,
    step: 0.001,
} as const;

export const FAUST_FILTER_FREQUENCY = {
    min: 20,
    max: 20000,
    step: 0.01,
} as const;

export const FAUST_OUTPUT_MASTER_GAIN = {
    min: 0,
    max: 2,
    step: 0.001,
} as const;
