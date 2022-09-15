import { SweetNothings } from "./sweetnothings.mjs";

export class SweetNothingsAPI {
    static whisperSweetNothings(isReply = false) {
        SweetNothings.whisperSweetNothings(isReply);
    }
}