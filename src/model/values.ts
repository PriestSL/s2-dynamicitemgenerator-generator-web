import type { ValidationResult } from './types.ts';

export type NumericUnit = 'weight' | 'percentage' | 'probability' | 'count';
export const MAX_ITEM_WEIGHT = 10_000;

// Shared limits for local editing and full JSON validation.
export function validateValue(value: unknown, unit: NumericUnit, path = ''): ValidationResult<number> {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return { ok: false, path, error: 'Expected a finite number' };
    }
    if (value < 0) return { ok: false, path, error: 'Must be nonnegative' };
    if (unit === 'count' && !Number.isInteger(value)) {
        return { ok: false, path, error: 'Expected an integer count' };
    }
    const maximum = unit === 'weight' ? MAX_ITEM_WEIGHT : unit === 'percentage' ? 100 : unit === 'probability' ? 1 : Infinity;
    if (value > maximum) return { ok: false, path, error: `Maximum is ${maximum}` };
    return { ok: true, value };
}

export function validateRange(min: unknown, max: unknown, unit: NumericUnit, path = ''): ValidationResult<[number, number]> {
    const lower = validateValue(min, unit, `${path}.min`);
    if (!lower.ok) return lower;
    const upper = validateValue(max, unit, `${path}.max`);
    if (!upper.ok) return upper;
    if (lower.value > upper.value) return { ok: false, path, error: 'Minimum exceeds maximum' };
    return { ok: true, value: [lower.value, upper.value] };
}

// This is the model rule; legacy CFG fallback is intentionally left for stage 3.
export function resolveOverride(override: number | undefined, inherited: number): number {
    return override ?? inherited;
}
