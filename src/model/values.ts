import type { ValidationResult } from './types.ts';

export type NumericUnit = 'weight' | 'percentage' | 'probability' | 'count';

// Scalar rules for the typed model. Parsing input strings and full JSON validation
// belong to the next stage; no existing UI/REST handler is redirected here yet.
export function validateValue(value: unknown, unit: NumericUnit, path = ''): ValidationResult<number> {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return { ok: false, path, error: 'Expected a finite number' };
    }
    if (value < 0) return { ok: false, path, error: 'Must be nonnegative' };
    if (unit === 'count' && !Number.isInteger(value)) {
        return { ok: false, path, error: 'Expected an integer count' };
    }
    const maximum = unit === 'percentage' ? 100 : unit === 'probability' ? 1 : Infinity;
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
