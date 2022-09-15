import { SWEETNOTHINGS } from "../config.mjs";
import { HelpFormApplication } from "../about/help-form-application.mjs";

export class SweetNothingsConfig extends HelpFormApplication {
    constructor(object, options) {
        if (!object) { object = {} };
        object.enableAboutButton = true;

        super(object, options);
    }

    static get defaultOptions() {
        const options = super.defaultOptions;

        const overrides = {
            id: "sweetNothingsConfig",
            template: SWEETNOTHINGS.TEMPLATES.CONFIG,
            submitOnChange: true,
            closeOnSubmit: false,
            width: 500,
            height: "auto",
            title: game.i18n.localize("SWEETNOTHINGS.CONFIGURATION.LABEL")
        };

        return foundry.utils.mergeObject(options, overrides);
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.on('click', '[data-action]', this._handleButtonClick.bind(this));
    }

    _onSelectFile(selection, filePicker) {
        this.submit();
    }

    async getData(options) {
        let sweetKeys = Object.keys(SWEETNOTHINGS.SETTINGS);
        let sweetSettings = {};
        let enableSound = game.settings.get(SWEETNOTHINGS.ID, "WhisperEnableSound");
        let enableNotification = game.settings.get(SWEETNOTHINGS.ID, "WhisperToastNotification");
        let notificationSound = game.settings.get(SWEETNOTHINGS.ID, "WhisperNotificationSound");
        let notificationVolume = game.settings.get(SWEETNOTHINGS.ID, "WhisperNotificationVolume");
        let historyLength = game.settings.get(SWEETNOTHINGS.ID, "WhisperHistoryLength");
        let enableRollInHistory = game.settings.get(SWEETNOTHINGS.ID, "WhisperRollInHistory");
        let enableRollToastNotification = game.settings.get(SWEETNOTHINGS.ID, "WhisperRollToastNotification");
        let enableRollSoundNotification = game.settings.get(SWEETNOTHINGS.ID, "WhisperRollSoundNotification");

        /* External Module Configurations */
        const configurations = game.settings.get(SWEETNOTHINGS.ID, "ExternalModuleNotifications");

        let externalModules = [];
        for (let key of Object.keys(SWEETNOTHINGS.EXTERNAL_MODULES)) {
            externalModules.push({
                id: key,
                label: game.modules.get(key)?.data?.title,
                enabled: SWEETNOTHINGS.EXTERNAL_MODULES[key],
                enableToast: configurations[key].toast,
                enableAudio: configurations[key].audio
            });
        }

        for (let key of sweetKeys) {
            let currentValue = game.settings.get(SWEETNOTHINGS.ID, key);

            sweetSettings[key] = {
                value: currentValue,
                choices: SWEETNOTHINGS.SETTINGS[key].choices
            }
        }

        return { sweetSettings, enableSound, enableNotification, notificationSound, notificationVolume, historyLength, enableRollInHistory, enableRollToastNotification, enableRollSoundNotification, externalModules };
    }

    async _updateObject(event, formData) {
        let configurations = game.settings.get(SWEETNOTHINGS.ID, "ExternalModuleNotifications");
        let keys = Object.keys(formData);
        for (let key of keys) {
            if (!key.startsWith("external_")) {
                if (key === "DEFAULT_MESSAGE_ENGINE" && !(game.release?.generation >= 10)) {
                    if (formData[key] === "prosemirror") { formData[key] === "tinymice"; }
                }
                await game.settings.set(SWEETNOTHINGS.ID, key, formData[key]);
            } else {
                let externalKey = "";
                if (key.endsWith("_toast")) {
                    externalKey = key.replace("external_", "").replace("_toast", "");
                    configurations[externalKey].toast = formData[key];
                } else {
                    externalKey = key.replace("external_", "").replace("_audio", "");
                    configurations[externalKey].audio = formData[key];
                }
            }
        }

        await game.settings.set(SWEETNOTHINGS.ID, "ExternalModuleNotifications", configurations);

        this.render();
    }

    async _handleButtonClick(event) {
        const clickedElement = $(event.currentTarget);
        const action = clickedElement.data().action;

        switch (action) {
            case 'playSound':
                let src = game.settings.get(SWEETNOTHINGS.ID, "WhisperNotificationSound");
                let volume = game.settings.get(SWEETNOTHINGS.ID, "WhisperNotificationVolume");
                AudioHelper.play({src, volume, autoplay: true, loop: false}, true);
                break;
            default:
                break;
        }
    }
}