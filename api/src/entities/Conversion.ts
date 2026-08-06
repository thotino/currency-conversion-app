import Quote from "./Quote";
import type { ConversionStatus } from "src/types";

export default class Conversion {
    #id: string;
    #userId: string;
    #status: ConversionStatus;
    #quote: Quote
    constructor(userId: string, idempotencyKey: string, quote: Quote, status: ConversionStatus) {
        this.#userId = userId;
        this.#status = status;
        this.#quote = quote;
        this.#id = idempotencyKey;
    }
    get quote() {
        return this.#quote;
    }
    markAsCompleted() {
        this.#status = "COMPLETED";
    }
    markAsFailed() {
        this.#status = "FAILED";
    }
    isCompleted() {return this.#status === "COMPLETED";}
    toJSON() {
        return {
            id: this.#id,
            status: this.#status,
            userId: this.#userId,
            quote: this.#quote
        }

    }
}