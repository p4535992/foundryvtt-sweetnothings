export const SWEETNOTHINGS = {};

SWEETNOTHINGS.ID = "sweetnothings";
SWEETNOTHINGS.MODULE_PATH = `modules/${SWEETNOTHINGS.ID}/`;

SWEETNOTHINGS.SETTINGS = {
    "DEFAULT_CHATMODE": {
        config: false,
        default: 'other',
        scope: 'client',
        type: String,
        choices: {
            "ic": "SWEETNOTHINGS.DIALOG.MODES.IC",
            "ooc": "SWEETNOTHINGS.DIALOG.MODES.OOC",
            "emote": "SWEETNOTHINGS.DIALOG.MODES.EMOTE",
            "other": "SWEETNOTHINGS.DIALOG.MODES.OTHER"
        }
    },
    "DEFAULT_DIALOG": {
        config: false,
        default: 'whisper',
        scope: 'client',
        type: String,
        choices: {
            "whisper": "SWEETNOTHINGS.DIALOG.WHISPER",
            "chat": "SWEETNOTHINGS.DIALOG.CHAT"
        }
    }
}

SWEETNOTHINGS.TEMPLATE_PATH = `${SWEETNOTHINGS.MODULE_PATH}/templates/`;
SWEETNOTHINGS.TEMPLATES = {
    CONFIG: `${SWEETNOTHINGS.TEMPLATE_PATH}sweetNothingsConfig.hbs`,
    DIALOG: `${SWEETNOTHINGS.TEMPLATE_PATH}sweetNothingsDialog.hbs`,
    HISTORY: `${SWEETNOTHINGS.TEMPLATE_PATH}sweetNothingsHistory.hbs`
}