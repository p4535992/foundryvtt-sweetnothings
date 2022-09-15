import { SWEETNOTHINGS } from './config.mjs';
import { SweetNothings } from './sweetnothings.mjs';
import { Logger } from './logger/logger.mjs';
import { AboutDialog } from './about/about-dialog.mjs';

Logger.MODULE_ID = AboutDialog.MODULE_ID = SWEETNOTHINGS.ID;

/*Enable Debug Module */
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(SWEETNOTHINGS.ID);
});

Hooks.once('init', () => { SweetNothings.initialize(); })
Hooks.once('ready', () => { SweetNothings.ready(); });

/* For Toast Notifications */
Hooks.on('createChatMessage', (message) => { SweetNothings.checkForWhisper(message); })