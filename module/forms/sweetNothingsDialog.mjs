import { SWEETNOTHINGS } from "../config.mjs";
import { SweetNothings } from "../sweetnothings.mjs";
import { SweetNothingsConfig } from "./sweetNothingsConfig.mjs";

export class SweetNothingsDialog extends FormApplication {
    constructor(object, options) {
        super(object, options);

        this.mode = game.settings.get(SWEETNOTHINGS.ID, "DEFAULT_DIALOG");
        this.chatMode = game.settings.get(SWEETNOTHINGS.ID, "DEFAULT_CHATMODE");
        this.whisperTargets = [];
    }

    static get defaultOptions() {
        const defaults = super.defaultOptions;

        const overrides = {
            closeOnSubmit: false,
            height: "auto",
            width: 500,
            id: 'sweetNothingsDialog',
            submitOnChange: true,
            template: SWEETNOTHINGS.TEMPLATES.DIALOG,
            tabs: [{ navSelector: ".tabs", contentSelector: "#sweetNothingsDialogForm", initial: game.settings.get(SWEETNOTHINGS.ID, "DEFAULT_DIALOG") }],
            title: game.i18n.localize("SWEETNOTHINGS.TITLE"),
            editable: true
        }

        return foundry.utils.mergeObject(defaults, overrides);
    }

    activateListeners(html) {
        super.activateListeners(html);

        //Add a configure button to the title bar
        const link = $(`<a title="${game.i18n.localize('SWEETNOTHINGS.CONFIGURATION.HINT')}"><i class="fas fa-cog"></i></a>`);

        link.on("click", () => this.renderConfig());

        SweetNothings.log(false, html);

        html.parents("#sweetNothingsDialog").find(".window-title").after(link);

        html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    }

    getData(options) {
        return { players: this.getActivePlayers(), messageText: "", chatMode: this.chatMode }
    }

    async _updateObject(event, formData) {
        SweetNothings.log(false, formData);
        this.chatMode = CONST.CHAT_MESSAGE_TYPES[formData.sweetNothingsChatMode.toUpperCase()];
        this.whisperTargets = formData.sweetNothingTarget;
    }

    async _handleButtonClick(event) {
        const clickedElement = $(event.currentTarget);
        const action = clickedElement.data().action;

        switch (action) {
            case "changeTab":
                this.mode = clickedElement.data().tab;
                break;
            case "cancel":
                this.close();
                break;
            case "submit":
                await this.submitSweetNothings();
                this.close();
                break;
            default:
                break;
        }
    }

    getActivePlayers() {
        let activeUsers = [];
        game.users.forEach(user => {
            if (user.active && user.id != game.userId) {
                activeUsers.push({ id: user.id, name: user.data.name });
            }
        });

        activeUsers.push({ id: "GM", name: "GM" });

        return activeUsers;
    }

    async submitSweetNothings() {
        const messageText = this.editors.messageText.mce.getContent();
        let bubble = false;

        let chatData = {
            author: game.userId,
            content: messageText,
            type: this.chatMode,
            whisper: null,
            speaker: null
        };

        if (this.mode === "whisper") {
            if (typeof (this.whisperTargets) === 'boolean') {
                chatData.whisper = ChatMessage.getWhisperRecipients('gm').map(o => o.id);
            } else {
                if (this.whisperTargets.includes('GM')) {
                    this.whisperTargets = this.whisperTargets.filter(t => t !== 'GM').concat(ChatMessage.getWhisperRecipients('gm').map(o => o.id));
                }

                chatData.whisper = this.whisperTargets;
            }
        } else if (this.chatMode === (CONST.CHAT_MESSAGE_TYPES.IC || CONST.CHAT_MESSAGE_TYPES.EMOTE || CONST.CHAT_MESSAGE_TYPES.OOC)) {
            if (canvas.tokens.controlled.length > 0) {
                chatData.speaker = ChatMessage.getSpeaker({ token: canvas.tokens.controlled[0] });
            } else {
                if (game.user.character) {
                    chatData.speaker = ChatMessage.getSpeaker({ actor: game.user.character })
                }
            }
        }

        bubble = (chatData.speaker && this.chatMode !== CONST.CHAT_MESSAGE_TYPES.OOC) ? true : false;

        await ChatMessage.create(chatData, { chatBubble: bubble });
    }

    renderConfig() {
        let config = new SweetNothingsConfig();
        config.render(true);
    }
}