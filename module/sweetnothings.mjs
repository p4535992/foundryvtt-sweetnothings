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
        //Currently cannot localize keybindings in v9.238, so name and hint are temporarily not localized.
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
            restricted: false,
            default: true,
            scope: 'client',
            type: Boolean
        });

        game.settings.register(SWEETNOTHINGS.ID, "WhisperEnableSound", {
            restricted: false,
            scope: 'client',
            type: Boolean,
            default: true
        });

        game.settings.register(SWEETNOTHINGS.ID, "WhisperNotificationSound", {
            restricted: false,
            scope: 'client',
            type: String,
            default: 'modules/sweetnothings/sounds/ting.ogg'
        });

        game.settings.register(SWEETNOTHINGS.ID, "WhisperNotificationVolume", {
            restricted: false,
            scope: 'client',
            type: Number,
            default: 0.1
        });

        game.settings.register(SWEETNOTHINGS.ID, "WhisperHistoryLength", {
            restricted: false,
            scope: 'client',
            type: Number,
            default: 7
        });

        game.settings.register(SWEETNOTHINGS.ID, "WhisperRollToastNotification", {
            restricted: false,
            scope: 'client',
            type: Boolean,
            default: false
        });

        game.settings.register(SWEETNOTHINGS.ID, "WhisperRollSoundNotification", {
            restricted: false,
            scope: 'client',
            type: Boolean,
            default: false
        });

        game.settings.register(SWEETNOTHINGS.ID, "WhisperRollInHistory", {
            restricted: false,
            scope: 'client',
            type: Boolean,
            default: true
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

        SweetNothings._checkGreetings();
        $(document).on("click",".sweetNothingsInitialConfig", SweetNothings._configureSweetWhispers.bind(this));
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
        let enableToastRollNotification = game.settings.get(SWEETNOTHINGS.ID, "WhisperRollToastNotification");
        let enableNotificationSound = game.settings.get(SWEETNOTHINGS.ID, "WhisperEnableSound");
        let enableNotificationRollSound = game.settings.get(SWEETNOTHINGS.ID, "WhisperRollSoundNotification");

        if (message.data.whisper && message.data.whisper.includes(game.userId)) {
            //This message is a whisper to us!
            let hasRollInfo = message.data.roll !== undefined;
            let showNotification = hasRollInfo ? (enableToastRollNotification && enableToastNotification) : enableToastNotification;
            if (showNotification) {
                let sender = ChatMessage.getSpeaker(message).alias;
                ui.notifications.info(game.i18n.localize("SWEETNOTHINGS.NOTIFICATIONS.NEW_MESSAGE") + ` ${sender}`);
            }

            let playSound = hasRollInfo ? (enableNotificationRollSound && enableNotificationSound) : enableNotificationSound;
            if (playSound) {
                let src = game.settings.get(SWEETNOTHINGS.ID, "WhisperNotificationSound");
                let volume = game.settings.get(SWEETNOTHINGS.ID, "WhisperNotificationVolume");
                AudioHelper.play({src, volume, autoplay: true, loop: false}, true);
            }
        }
    }

    static async _checkGreetings() {
        let initialGreeting = game.user.getFlag(SWEETNOTHINGS.ID, "WhisperGreetingCompleted");
        if (!initialGreeting) {
            let content = await renderTemplate(SWEETNOTHINGS.TEMPLATES.GREETING, {});

            let chatData = {
                author: game.userId,
                content,
                type: CONST.CHAT_MESSAGE_TYPES.WHISPER,
                whisper: [game.userId],
                speaker: null
            };
    
            let message = await ChatMessage.create(chatData, { });

            game.user.setFlag(SWEETNOTHINGS.ID, "WhisperGreetingCompleted", true);
        }
    }

    static _configureSweetWhispers() {
        let config = new SweetNothingsConfig();
        config.render(true);
    }
}