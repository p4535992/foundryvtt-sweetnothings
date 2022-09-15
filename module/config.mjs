export const SWEETNOTHINGS = {};

SWEETNOTHINGS.ID = "sweetnothings";
SWEETNOTHINGS.MODULE_PATH = `modules/${SWEETNOTHINGS.ID}/`;
SWEETNOTHINGS.FOUNDRY_VERSION = 0;

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
    },
    "WHISPER_HISTORY_LENGTH": {
        config: false,
        default: 7,
        scope: 'client',
        type: String,
        choices: {
            1: "1 Day",
            5: "5 Days",
            7: "7 Days",
            14: "14 Days",
            30: "30 Days"
        }
    },
    "DEFAULT_MESSAGE_ENGINE": {
        config: false,
        default: game.release?.generation >= 10 ? "prosemirror" : "tinymce",
        scope: 'client',
        type: String,
        choices: {
            "prosemirror": "Default (Prose Mirror, FVTT v10)",
            "tinymce": "TinyMCE (Deprecated/FVTT v9)",
            "none": "None"
        }
    }
}

SWEETNOTHINGS.TEMPLATE_PATH = `${SWEETNOTHINGS.MODULE_PATH}/templates/`;
SWEETNOTHINGS.TEMPLATES = {
    CONFIG: `${SWEETNOTHINGS.TEMPLATE_PATH}sweetNothingsConfig.hbs`,
    DIALOG: `${SWEETNOTHINGS.TEMPLATE_PATH}sweetNothingsDialog.hbs`,
    GREETING: `${SWEETNOTHINGS.TEMPLATE_PATH}sweetNothingsGreeting.hbs`,
    HISTORY: `${SWEETNOTHINGS.TEMPLATE_PATH}sweetNothingsHistory.hbs`
}

SWEETNOTHINGS.EXTERNAL_MODULES = {
    "damage-log": false
}