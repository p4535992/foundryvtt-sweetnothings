import { SWEETNOTHINGS } from "../config.mjs";
import { SweetNothings } from "../sweetnothings.mjs";
import { SweetNothingsConfig } from "./sweetNothingsConfig.mjs";

export class SweetNothingsDialog extends FormApplication {
    #mode = null;
    #chatMode = null;
    #whisperTargets = [];
    #replyTarget = null;
    #history = [];
    #panelCollapsed = true;

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

        return buttons;
    }

    async activateListeners(html) {
        super.activateListeners(html);

        SweetNothings.log(false, "Get Defaults:", this, html);
        //Setup Whisper History Panel
        await this._renderHistoryPanel();

        this.element.on('click', '.sweetNothingsDialogToggle', this._toggleHistoryPanel.bind(this));
        html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    }

    getData(options) {
        let data = { 
            players: this.getActivePlayers(), 
            messageText: "", 
            chatMode: this.#chatMode, 
        };

        SweetNothings.log(false, "Retrieving Data", data);

        return data;
    }

    async _updateObject(event, formData) {
        SweetNothings.log(false, formData);
        this.#chatMode = formData.sweetNothingsChatMode;
        this.#whisperTargets = formData.sweetNothingTarget;
        this.#history = await this.getWhisperHistory();

        await this._renderHistoryPanel();
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
            } else {
                this.#whisperTargets.push(this.#replyTarget);
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
            type: CONST.CHAT_MESSAGE_TYPES[this.#chatMode.toUpperCase()],
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
        } else if ([CONST.CHAT_MESSAGE_TYPES.IC, CONST.CHAT_MESSAGE_TYPES.EMOTE, CONST.CHAT_MESSAGE_TYPES.OOC].includes(chatData.type)) {
            if (canvas.tokens.controlled.length > 0) {
                chatData.speaker = ChatMessage.getSpeaker({ token: canvas.tokens.controlled[0].data });
            } else {
                if (game.user.character) {
                    chatData.speaker = ChatMessage.getSpeaker({ actor: game.user.character })
                }
            }
        }

        bubble = (chatData.speaker && chatData.type !== CONST.CHAT_MESSAGE_TYPES.OOC) ? true : false;

        SweetNothings.log(false, "Creating Chat Message:", chatData);

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
        //Set Date Limit based on config
        let days = parseInt(game.settings.get(SWEETNOTHINGS.ID, "WHISPER_HISTORY_LENGTH"));
        let today = new Date();
        let filter = new Date(today.getFullYear(), today.getMonth(), today.getDate()-days).getTime();
        let includeRollMessages = game.settings.get(SWEETNOTHINGS.ID, "WhisperRollInHistory");

        let baseMessages = game.messages.filter(m => m.data.timestamp >= filter && m.data.whisper.includes(game.userId)).sort((a, b) => { return a.data.timestamp > b.data.timestamp ? -1 : 1; });
        if (!includeRollMessages) { baseMessages = baseMessages.filter(m => m.data.roll === undefined); }

        let toRender = [];
        //Filter now based on selected targets
        SweetNothings.log(false, "Filtering Whisper History:", baseMessages, this.#whisperTargets);
        if (this.#whisperTargets && this.#whisperTargets.length > 0 && !(this.#whisperTargets.length === 1 && this.#whisperTargets[0] === 'GM')) {
            for (let target of this.#whisperTargets) {
                if (target === 'GM') { continue; }
                toRender = toRender.concat(baseMessages.filter(m => m.data.user === target || m.data.whisper.includes(target)));
            }
        } else {
            toRender = toRender.concat(baseMessages);
        }

        //Time to map it
        let history = [];
        for (let t of toRender) {
            let m = await t.getHTML();
            history.push(m[0].outerHTML.replace(`<a class="message-delete"><i class="fas fa-trash"></i></a>`, ``).trim()); //Remove trash can icon!
        }

        return history;
    }

    _toggleHistoryPanel(event) {
        this.#panelCollapsed = !this.#panelCollapsed;
        this.element.find("#sweetNothingsDialogPanel").addClass("animate");
        this.element.find('#sweetNothingsDialogPanel')[0].classList.toggle("collapsed");
        this.element.find('#sweetNothingsDialogPanel')[0].classList.toggle("opened");
    }

    async _renderHistoryPanel() {
        if (this.element.find("#sweetNothingsDialogPanel")) {
            this.element.find("#sweetNothingsDialogPanel").remove();
        }

        if (!this.#history || this.#history.length < 1) { this.#history = await this.getWhisperHistory(); }
        let sideBar = await renderTemplate(SWEETNOTHINGS.TEMPLATES.HISTORY, { history: this.#history, collapsed: this.#panelCollapsed });

        this.element.prepend(sideBar);
    }
}