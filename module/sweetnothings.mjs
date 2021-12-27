import { SWEETNOTHINGS } from "./config.mjs";
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

        return this.preloadHandlebarTemplates();
    }

    static ready() {
        let sweetActions = game.keybindings.actions.get("SweetNothings.whisperSweetNothings");
        sweetActions.name = game.i18n.localize("SWEETNOTHINGS.TITLE");
        sweetActions.hint = game.i18n.localize("SWEETNOTHINGS.HINT");
    }

    static preloadHandlebarTemplates = async function() {
        const templates = Object.keys(SWEETNOTHINGS.TEMPLATES).map(function(key) { return SWEETNOTHINGS.TEMPLATES[key]; });
        return loadTemplates(templates);
    }

    static whisperSweetNothings() {
        let dialog = new SweetNothingsDialog();
        dialog.render(true);
    }
}