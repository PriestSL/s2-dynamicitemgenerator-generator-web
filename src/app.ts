import * as bootstrap from 'bootstrap';
import { installBootstrap } from './ui/bootstrap.ts';
import { Application } from './ui/application.ts';
import { PresetsManager } from './integrations/presetsManager.ts';
import { downloadPackage } from './integrations/restCalls.ts';
import { setPackageTransport } from './files/packageTransport.ts';
import './css/theme.scss';

export let app: Application;
function initialize(): void {
    installBootstrap(bootstrap);
    setPackageTransport(downloadPackage);
    app = new Application((state, controller) => new PresetsManager(state, controller));
    app.initialize();
    window.S2App = app;
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
else initialize();

declare global {
    interface Window { S2App: Application }
}
