import { SWEETNOTHINGS } from "../config.mjs";
import { SweetNothings } from "../sweetnothings.mjs";
import { SweetNothingsConfig } from "./sweetNothingsConfig.mjs";

export class SweetNothingsDialog extends FormApplication {
    constructor(object, options) {
        super(object, options);

        this.mode = game.settings.get(SWEETNOTHINGS.ID, "DEFAULT_DIALOG");
        this.chatMode = game.settings.get(SWEETNOTHINGS.ID, "DEFAULT_CHATMODE");
        this.whisperTargets = [];
        this.replyTarget = null;
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
            tabs: [{ navSelector: ".tabs", contentSelector: "#sweetNothingsDialogForm", initial: SweetNothingsDialog._isReply ? "reply" : game.settings.get(SWEETNOTHINGS.ID, "DEFAULT_DIALOG") }],
            title: game.i18n.localize("SWEETNOTHINGS.TITLE"),
            editable: true
        }

        return foundry.utils.mergeObject(defaults, overrides);
    }

    activateListeners(html) {
        super.activateListeners(html);

        //Add a configure button to the title bar
        const link = $(`<a id="sweetNothingsDialogConfig" title="${game.i18n.localize('SWEETNOTHINGS.CONFIGURATION.HINT')}"><i class="fas fa-cog"></i></a>`);
        console.log(html);
        if (html.parents("#sweetNothingsDialog").find("#sweetNothingsDialogConfig").length === 0) {
            link.on("click", () => this.renderConfig());
    
            html.parents("#sweetNothingsDialog").find(".window-title").after(link);
        }

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
                if (this.mode === "reply") {
                    this.display(true);
                }
                break;
            case "cancel":
                this.close();
                break;
            case "reply":
                this.display(true);
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
                activeUsers.push({ replyTo: user.id === this.replyTarget, id: user.id, name: user.data.name });
            }
        });

        if (this.replyTarget && !activeUsers.find(a => a.id === this.replyTarget)) {
            //Reply Target is not online?
            ui.notifications.warn("Target to reply to is not online.");
            this.mode = "whisper";
            this.replyTarget = null;
            SweetNothingsDialog._isReply = false;
        }

        activeUsers.push({ id: "GM", name: "GM" });

        return activeUsers;
    }

    display(isReply = false) {
        SweetNothingsDialog._isReply = isReply;
        if (isReply) {
            this.getLastWhisperSender();
            if (!this.replyTarget) {
                SweetNothingsDialog._isReply = false; 
                ui.notifications.warn("No message found to reply to!");
            }
        } else {
            this.replyTarget = null;
        }

        this.render(true);
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
            if (this.whisperTargets.length === 0 && this.replyTarget) { this.whisperTargets.push(this.replyTarget); }

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

    getLastWhisperSender() {
        let lastMessages = game.messages.filter(m => m.data.type === CONST.CHAT_MESSAGE_TYPES.WHISPER && m.data.whisper.includes(game.userId));
        if (lastMessages) {
            let lastMessage = lastMessages[lastMessages.length -1];
            this.replyTarget = lastMessage?.data?.user;
        }
    }
}