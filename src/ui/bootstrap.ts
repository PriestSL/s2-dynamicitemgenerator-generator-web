export type BootstrapUI = typeof import('bootstrap');
let runtime: BootstrapUI | undefined;

export function installBootstrap(value: BootstrapUI): void {
    runtime = value;
    // PresetsManager still constructs its own Bootstrap dialogs until stage 7.
    window.bootstrap = value;
}

export function bootstrapUI(): BootstrapUI {
    if (!runtime) throw new Error('Bootstrap UI has not been initialized');
    return runtime;
}
