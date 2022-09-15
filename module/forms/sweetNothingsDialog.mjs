import { HelpFormApplication } from "../about/help-form-application.mjs";
import { SWEETNOTHINGS } from "../config.mjs";
import { Logger } from "../logger/logger.mjs";
import { SweetNothingsConfig } from "./sweetNothingsConfig.mjs";

export class SweetNothingsDialog extends HelpFormApplication {
    #worker = null;
    #mode = null;
    #chatMode = null;
    #whisperTargets = [];
    #replyTarget = null;
    #history = [];
    #panelCollapsed = true;
    #workerRunning = false;
    #messageText = null;

    constructor(object, options) {
        if (!object) { object = {} };
        object.enableAboutButton = true;

        super(object, options);

        this._getDefaults();
        if (window.Worker) {
            this.#worker = new Worker(`/modules/${SWEETNOTHINGS.ID}/module/workers/chatWorker.mjs`);
        }
    }

    async _getDefaults() {
        this.#mode = game.settings.get(SWEETNOTHINGS.ID, "DEFAULT_DIALOG");
        this.#chatMode = game.settings.get(SWEETNOTHINGS.ID, "DEFAULT_CHATMODE");
        this.#whisperTargets = [];
        this.#replyTarget = null;
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

        Logger.debug(false, "Get Defaults:", this, html);
        //Setup Whisper History Panel
        await this._renderHistoryPanel();

        this.element.on('click', '.sweetNothingsDialogToggle', this._toggleHistoryPanel.bind(this));
        html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    }

    getData(options) {
        let defaultEngine = game.settings.get("sweetnothings", "DEFAULT_MESSAGE_ENGINE");

        let data = { 
            players: this.getActivePlayers(), 
            messageText: "", 
            chatMode: this.#chatMode,
            isFVTTGen9: !(game.release?.generation >= 10),
            engine: defaultEngine
        };

        Logger.debug(false, "Retrieving Data", data);

        return data;
    }

    async _updateObject(event, formData) {
        Logger.debug(false, formData);
        this.#chatMode = formData.sweetNothingsChatMode;
        this.#whisperTargets = formData.sweetNothingTarget;
        this.#messageText = formData.sweetNothingsMessageText;
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
            if (user.id !== game.userId) {
                if (SWEETNOTHINGS.FOUNDRY_VERSION >= 10) {
                    activeUsers.push({ replyTo: user.id === this.#replyTarget, id: user.id, name: user.name });
                } else {
                    activeUsers.push({ replyTo: user.id === this.#replyTarget, id: user.id, name: user.data.name });
                }
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
        const messageText = this.#messageText ?? this.editors.messageText.mce.getContent();
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
                chatData.speaker = SWEETNOTHINGS.FOUNDRY_VERSION >= 10 ? ChatMessage.getSpeaker({ token: canvas.tokens.controlled[0] }) : chatData.speaker = ChatMessage.getSpeaker({ token: canvas.tokens.controlled[0].data });
            } else {
                if (game.user.character) {
                    chatData.speaker = ChatMessage.getSpeaker({ actor: game.user.character })
                }
            }
        }

        bubble = (chatData.speaker && chatData.type !== CONST.CHAT_MESSAGE_TYPES.OOC) ? true : false;

        Logger.debug(false, "Creating Chat Message:", chatData);

        await ChatMessage.create(chatData, { chatBubble: bubble });
    }

    renderConfig() {
        let config = new SweetNothingsConfig();
        config.render(true);
    }

    getLastWhisperSender() {
        let lastMessages = SWEETNOTHINGS.FOUNDRY_VERSION >= 10 ? game.messages.filter(m => m.whisper.includes(game.userId)) : game.messages.filter(m => m.data.whisper.includes(game.userId));
        if (lastMessages) {
            let lastMessage = lastMessages[lastMessages.length -1];
            this.#replyTarget = SWEETNOTHINGS.FOUNDRY_VERSION >= 10 ? lastMessage?.user : lastMessage?.data?.user;
        }
    }

    async getWhisperHistory() {
        //Set Date Limit based on config
        if (window.Worker && this.#worker) {
            this.#worker.onmessage = async (response) => {
                //We need to render it!
                let history = [];

                for (let t of response.data) {
                    let m = game.messages.get(t.id);
                    let message = await m.getHTML();
                    history.push(message[0].outerHTML.replace(`<a class="message-delete"><i class="fas fa-trash"></i></a>`, ``).trim()); //Remove trash can icon!
                }

                this.#history = history;
                this.#workerRunning = false;
                this._renderHistoryPanel();
            }

            let settings = {
                historyLength: game.settings.get("sweetnothings", "WHISPER_HISTORY_LENGTH"),
                includeRolls: game.settings.get("sweetnothings", "WhisperRollInHistory"),
                targets: this.#whisperTargets.filter(t => t !== null),
                messages: game.messages.map(m => { return { id: m._id, whisper: m.whisper, timestamp: m.timestamp, rolls: m.rolls, user: m.user}}),
                userId: game.userId,
                fvttGeneration: game.release?.generation
            };

            this.#worker.postMessage(settings);
            this.#workerRunning = true;
            return;
        }
    }

    _toggleHistoryPanel(event) {
        this.#panelCollapsed = !this.#panelCollapsed;
        this.element.find("#sweetNothingsDialogPanel").addClass("animate");
        this.element.find('#sweetNothingsDialogPanel')[0].classList.toggle("collapsed");
        this.element.find('#sweetNothingsDialogPanel')[0].classList.toggle("opened");

        if (Array.from(this.element.find("#sweetNothingsDialogPanel")[0].classList).includes("opened")) {
            this._renderHistoryPanel(true);
        }
    }

    async _renderHistoryPanel(refreshWhisperHistory = false) {
        if (refreshWhisperHistory) {
            await this.getWhisperHistory();
        }

        if (this.element.find("#sweetNothingsDialogPanel")) {
            this.element.find("#sweetNothingsDialogPanel").remove();
        }

        let sideBar = await renderTemplate(SWEETNOTHINGS.TEMPLATES.HISTORY, { history: this.#history, collapsed: this.#panelCollapsed, loading: this.#workerRunning });

        this.element.prepend(sideBar);
    }
}