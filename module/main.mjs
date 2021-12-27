import { SWEETNOTHINGS } from './config.mjs';
import { SweetNothings } from './sweetnothings.mjs';

/*Enable Debug Module */
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(SWEETNOTHINGS.ID);
});

Hooks.once('init', () => { SweetNothings.initialize(); })
Hooks.once('ready', () => { SweetNothings.ready(); });