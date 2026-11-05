export interface PresetHeader {
    _id: string;
    name: string;
    author?: string;
    version?: string;
    views?: number;
}

function record(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid server response');
    return value as Record<string, unknown>;
}

export function presetHeaders(value: unknown): { officialPresets: PresetHeader[]; publicPresets: PresetHeader[] } {
    const data = record(value);
    if (data.error) throw new Error(typeof data.error === 'string' ? data.error : 'Invalid server error');
    const list = (value: unknown): PresetHeader[] => {
        if (value === undefined) return [];
        if (!Array.isArray(value)) throw new Error('Invalid preset list');
        return value.map((entry: unknown) => {
            const item = record(entry);
            if (typeof item._id !== 'string' || typeof item.name !== 'string') throw new Error('Invalid preset header');
            const header: PresetHeader = { _id: item._id, name: item.name };
            for (const key of ['author', 'version'] as const) {
                if (item[key] !== undefined) {
                    if (typeof item[key] !== 'string') throw new Error(`Invalid preset ${key}`);
                    header[key] = item[key];
                }
            }
            if (item.views !== undefined) {
                if (typeof item.views !== 'number' || !Number.isFinite(item.views)) throw new Error('Invalid preset views');
                header.views = item.views;
            }
            return header;
        });
    };
    return { officialPresets: list(data.officialPresets), publicPresets: list(data.publicPresets) };
}

type OperationResult<T> = { result: T; error?: never } | { error: string };

export function presetOperation(value: unknown, kind: 'id'): OperationResult<string>;
export function presetOperation(value: unknown, kind: 'flag'): OperationResult<boolean>;
export function presetOperation(value: unknown, kind: 'id' | 'flag'): OperationResult<string | boolean> {
    if (!value || typeof value !== 'object') return { error: 'Invalid operation response' };
    if ('error' in value && typeof value.error === 'string') return { error: value.error };
    if ('result' in value) {
        if (kind === 'id' && typeof value.result === 'string') return { result: value.result };
        if (kind === 'flag' && typeof value.result === 'boolean') return { result: value.result };
    }
    return { error: 'Invalid operation result' };
}

/** Hidden legacy Update button had no implementation; preserve its failure until separately fixed. */
export function unavailablePresetUpdate(): never {
    throw new TypeError('this.handleUpdatePreset is not a function');
}

export function requiredElement(id: string): HTMLElement {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Missing element: ${id}`);
    return node;
}

export function formValue(id: string): string {
    const node = requiredElement(id);
    if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)) throw new Error(`Invalid form field: ${id}`);
    return node.value;
}
