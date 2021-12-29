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

    async getData(options) {
        let sweetKeys = Object.keys(SWEETNOTHINGS.SETTINGS);
        let sweetSettings = {};

        for (let key of sweetKeys) {
            let currentValue = game.settings.get(SWEETNOTHINGS.ID, key);

            sweetSettings[key] = {
                value: currentValue,
                choices: SWEETNOTHINGS.SETTINGS[key].choices
            }
        }

        return { sweetSettings };
    }

    async _updateObject(event, formData) {
        let keys = Object.keys(formData);
        for (let key of keys) {
            await game.settings.set(SWEETNOTHINGS.ID, key, formData[key]);
        }
    }
}