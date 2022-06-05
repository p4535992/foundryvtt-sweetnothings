import { SWEETNOTHINGS } from "./config.mjs";
import { SweetNothingsConfig } from "./forms/sweetNothingsConfig.mjs";
import { SweetNothingsDialog } from "./forms/sweetNothingsDialog.mjs";

export class SweetNothings {
    static log(force, ...args) {
        const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(SWEETNOTHINGS.ID);

        if (shouldLog) {
            console.log(SWEETNOTHINGS.ID, '|', ...args);
        }
    }

    static initialize() {
        //Currently cannot localize keybindings in v9.238, so name and hint are 
        game.keybindings.register(SWEETNOTHINGS.ID, "whisperSweetNothings", {
            name: "Name",
            hint: "Hint",
            editable: [
                {
                    key: "KeyW",
                    modifiers: ["Alt"]
                }
            ],
            onDown: () => {  },
            onUp: () => { this.whisperSweetNothings(); },
            restricted: false,
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
        });

        game.keybindings.register(SWEETNOTHINGS.ID, "whisperSweetNothingsReply", {
            name: "Name",
            hint: "Hint",
            editable: [
                {
                    key: "KeyR",
                    modifiers: ["Alt"]
                }
            ],
            onDown: () => {  },
            onUp: () => { this.whisperSweetNothingsReply(); },
            restricted: false,
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
        })

        //Game Settings
        const sweetSettings = Object.keys(SWEETNOTHINGS.SETTINGS);
        for (let setting of sweetSettings) {
            game.settings.register(SWEETNOTHINGS.ID, setting, SWEETNOTHINGS.SETTINGS[setting]);
        }

        game.settings.register(SWEETNOTHINGS.ID, "GM_ALWAYS_IC", {
            name: game.i18n.localize("SWEETNOTHINGS.CONFIGURATION.GM_ALWAYS_IC.Name"),
            hint: game.i18n.localize("SWEETNOTHINGS.CONFIGURATION.GM_ALWAYS_IC.Hint"),
            restricted: true,
            config: true,
            default: true,
            scope: 'world',
            type: Boolean
        })

        game.settings.register(SWEETNOTHINGS.ID, "WhisperToastNotification", {
            name: game.i18n.localize("SWEETNOTHINGS.CONFIGURATION.WHISPER_TOAST_NOTIFICATION.Name"),
            hint: game.i18n.localize("SWEETNOTHINGS.CONFIGURATION.WHISPER_TOAST_NOTIFICATION.Hint"),
            restricted: false,
            config: true,
            default: true,
            scope: 'client',
            type: Boolean
        });

        //Register the setting menu
        game.settings.registerMenu(SWEETNOTHINGS.ID, "UserConfiguration", {
            name: "PerUserConfiguration",
            label: game.i18n.localize("SWEETNOTHINGS.CONFIGURATION.LABEL"),
            hint: game.i18n.localize("SWEETNOTHINGS.CONFIGURATION.HINT"),
            icon: "fas fa-wrench",
            type: SweetNothingsConfig
        });

        //Handlebar helper for localizing settings
        Handlebars.registerHelper("sweetNothingsLocalizer", function(key) {
            return game.i18n.localize(`SWEETNOTHINGS.CONFIGURATION.${key}`);
        });

        Handlebars.registerHelper('sweetNothingsSelected', function(value1, value2) {
            if (value1 === value2) {
                return 'selected';
            }

            return '';
        });

        Handlebars.registerHelper('sweetNothingsChecked', function(value1, value2) {
            if (value1 === value2) {
                return 'checked';
            }

            return '';
        })

        return this.preloadHandlebarTemplates();
    }

    static ready() {
        let sweetActions = game.keybindings.actions.get("sweetnothings.whisperSweetNothings");
        sweetActions.name = game.i18n.localize("SWEETNOTHINGS.TITLE");
        sweetActions.hint = game.i18n.localize("SWEETNOTHINGS.HINT");

        sweetActions = game.keybindings.actions.get("sweetnothings.whisperSweetNothingsReply");
        sweetActions.name = game.i18n.localize("SWEETNOTHINGS.KEYBINDINGS.REPLY.NAME");
        sweetActions.hint = game.i18n.localize("SWEETNOTHINGS.KEYBINDINGS.REPLY.HINT");
    }

    static preloadHandlebarTemplates = async function() {
        const templates = Object.keys(SWEETNOTHINGS.TEMPLATES).map(function(key) { return SWEETNOTHINGS.TEMPLATES[key]; });
        return loadTemplates(templates);
    }

    static whisperSweetNothings() {
        let dialog = new SweetNothingsDialog();
        dialog.display();
        return true;
    }

    static whisperSweetNothingsReply() {
        let dialog = new SweetNothingsDialog();
        dialog.display(true);
        return true;
    }

    static checkForWhisper(message) {
        let enableToastNotification = game.settings.get(SWEETNOTHINGS.ID, "WhisperToastNotification");

        if (enableToastNotification && message.data.whisper && message.data.whisper.includes(game.userId)) {
            //This message is a whisper to us!
            let sender = ChatMessage.getSpeaker(message).alias;
            ui.notifications.info(game.i18n.localize("SWEETNOTHINGS.NOTIFICATIONS.NEW_MESSAGE") + ` ${sender}`);
        }
    }
}