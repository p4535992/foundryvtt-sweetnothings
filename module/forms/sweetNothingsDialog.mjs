import { SWEETNOTHINGS } from "../config.mjs";
import { SweetNothings } from "../sweetnothings.mjs";
import { SweetNothingsConfig } from "./sweetNothingsConfig.mjs";

export class SweetNothingsDialog extends FormApplication {
    #mode = null;
    #chatMode = null;
    #whisperTargets = [];
    #replyTarget = null;
    #history = [];

    constructor(object, options) {
        super(object, options);

        this._getDefaults();
    }

    async _getDefaults() {
        this.#mode = game.settings.get(SWEETNOTHINGS.ID, "DEFAULT_DIALOG");
        this.#chatMode = game.settings.get(SWEETNOTHINGS.ID, "DEFAULT_CHATMODE");
        this.#whisperTargets = [];
        this.#replyTarget = null;

        this.#history = await this.getWhisperHistory();
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

    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();

        //Add a configure button to the title bar
        buttons.unshift({
            label: "",
            class: "sweetNothingsConfigButton",
            title: game.i18n.localize("SWEETNOTHINGS.CONFIGURATION.HINT"),
            icon: "fas fa-cog",
            onclick: () => { this.renderConfig(); }
        });

        SweetNothings.log(false, "Dialog:", this);

        return buttons;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    }

    getData(options) {
        let data = { 
            players: this.getActivePlayers(), 
            messageText: "", 
            chatMode: this.#chatMode, 
            history: this.#history 
        };

        SweetNothings.log(false, "Retrieving Data", data);

        return data;
    }

    async _updateObject(event, formData) {
        SweetNothings.log(false, formData);
        this.#chatMode = CONST.CHAT_MESSAGE_TYPES[formData.sweetNothingsChatMode.toUpperCase()];
        this.#whisperTargets = formData.sweetNothingTarget;
        this.#history = await this.getWhisperHistory();
    }

    async _handleButtonClick(event) {
        const clickedElement = $(event.currentTarget);
        const action = clickedElement.data().action;

        switch (action) {
            case "changeTab":
                this.#mode = clickedElement.data().tab;
                if (this.#mode === "reply") {
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
            //if (user.active && user.id != game.userId) {
            if (user.id !== game.userId) {
                activeUsers.push({ replyTo: user.id === this.#replyTarget, id: user.id, name: user.data.name });
            }
        });

        if (this.#replyTarget && !activeUsers.find(a => a.id === this.#replyTarget)) {
            //Reply Target is not online?
            ui.notifications.warn(game.i18n.localize("SWEETNOTHINGS.WARNINGS.TARGET_NOT_ONLINE"));
            this.#mode = "whisper";
            //this.#replyTarget = null;
            //SweetNothingsDialog._isReply = false;
        }

        activeUsers.push({ id: "GM", name: "GM" });

        return activeUsers;
    }

    display(isReply = false) {
        SweetNothingsDialog._isReply = isReply;
        if (isReply) {
            this.getLastWhisperSender();
            if (!this.#replyTarget) {
                SweetNothingsDialog._isReply = false; 
                ui.notifications.warn("No message found to reply to!");
            }
        } else {
            this.#replyTarget = null;
            this._getDefaults();
        }

        this.render(true);
    }

    async submitSweetNothings() {
        const messageText = this.editors.messageText.mce.getContent();
        let bubble = false;

        let chatData = {
            author: game.userId,
            content: messageText,
            type: this.#chatMode,
            whisper: null,
            speaker: null
        };

        if (this.#mode === "whisper") {
            if (game.settings.get(SWEETNOTHINGS.ID, "GM_ALWAYS_IC")) {
                chatData.type = CONST.CHAT_MESSAGE_TYPES.IC;
            } else {
                chatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER;
            }

            if (this.#whisperTargets.length === 0 && this.#replyTarget) { this.#whisperTargets.push(this.#replyTarget); }

            if (typeof (this.#whisperTargets) === 'boolean') {
                chatData.whisper = ChatMessage.getWhisperRecipients('gm').map(o => o.id);
            } else {
                if (this.#whisperTargets.includes('GM')) {
                    this.#whisperTargets = this.#whisperTargets.filter(t => t !== 'GM').concat(ChatMessage.getWhisperRecipients('gm').map(o => o.id));
                }

                chatData.whisper = this.#whisperTargets;
            }
        } else if (this.#chatMode === (CONST.CHAT_MESSAGE_TYPES.IC || CONST.CHAT_MESSAGE_TYPES.EMOTE || CONST.CHAT_MESSAGE_TYPES.OOC)) {
            if (canvas.tokens.controlled.length > 0) {
                chatData.speaker = ChatMessage.getSpeaker({ token: canvas.tokens.controlled[0] });
            } else {
                if (game.user.character) {
                    chatData.speaker = ChatMessage.getSpeaker({ actor: game.user.character })
                }
            }
        }

        bubble = (chatData.speaker && this.#chatMode !== CONST.CHAT_MESSAGE_TYPES.OOC) ? true : false;

        await ChatMessage.create(chatData, { chatBubble: bubble });
    }

    renderConfig() {
        let config = new SweetNothingsConfig();
        config.render(true);
    }

    getLastWhisperSender() {
        let lastMessages = game.messages.filter(m => m.data.whisper.includes(game.userId));
        if (lastMessages) {
            let lastMessage = lastMessages[lastMessages.length -1];
            this.#replyTarget = lastMessage?.data?.user;
        }
    }

    async getWhisperHistory() {
        //Set Date Limit (one week)
        let today = new Date();
        let filter = new Date(today.getFullYear(), today.getMonth(), today.getDate()-7).getTime();

        let baseMessages = game.messages.filter(m => m.data.timestamp >= filter && m.data.whisper.includes(game.userId));
        let toRender = [];
        //Filter now based on selected targets
        if (this.#whisperTargets && this.#whisperTargets.length > 0) {
            for (let target of this.#whisperTargets) {
                toRender = toRender.concat(baseMessages.filter(m => m.data.owner === target || m.data.whisper.includes(target)));
            }
        } else {
            toRender = toRender.concat(baseMessages);
        }

        //Time to map it
        let history = [];
        for (let t of toRender) {
            let m = await t.getHTML();
            history.push(m[0]?.outerHTML);
        }

        return history;
    }
}