import { SWEETNOTHINGS } from "../config.mjs";
import { SweetNothings } from "../sweetnothings.mjs";

export class SweetNothingsConfig extends FormApplication {
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

        for (let key of sweetKeys) {
            let currentValue = game.settings.get(SWEETNOTHINGS.ID, key);

            sweetSettings[key] = {
                value: currentValue,
                choices: SWEETNOTHINGS.SETTINGS[key].choices
            }
        }

        return { sweetSettings, enableSound, enableNotification, notificationSound, notificationVolume };
    }

    async _updateObject(event, formData) {
        let keys = Object.keys(formData);
        for (let key of keys) {
            await game.settings.set(SWEETNOTHINGS.ID, key, formData[key]);
        }
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