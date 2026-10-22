import * as bootstrap from 'bootstrap';
import { installBootstrap } from './ui/bootstrap.ts';
import { Application } from './ui/application.ts';
import { legacyPresets, legacyPackageTransport } from './compatibility/integrations.ts';
import { setPackageTransport } from './files/packageTransport.ts';
import './css/custom.scss';
import './css/comparison.css';
import './css/editor.css';

// Vite imports these deferred JS modules as unknown; the boundary checks exports.
const deferred = import.meta.glob<unknown>(['./js/presets/presetsManager.js', './js/restCalls.js'], { eager: true });
export let app: Application;
function initialize(): void {
    installBootstrap(bootstrap);
    setPackageTransport(legacyPackageTransport(deferred['./js/restCalls.js']));
    app = new Application((state, controller) => legacyPresets(deferred['./js/presets/presetsManager.js'], state, controller));
    app.initialize();
    window.S2App = app;
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
else initialize();

declare global {
    interface Window { S2App: Application }
}
