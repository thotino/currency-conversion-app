import Quote from "./Quote";

type ConversionStatus = "PENDING" | "COMPLETED" | "FAILED";
export default class Conversion {
    #id: string;
    #userId: string;
    #status: ConversionStatus;
    #quote: Quote
    constructor(userId: string, idempotencyKey: string, quote: Quote) {
        // if (quote.isExpired()) {
        //     throw new Error("EXPIRED QUOTE");
        // }
        this.#userId = userId;
        this.#status = "PENDING";
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
    toJSON() {
        return {
            id: this.#id,
            status: this.#status,
            userId: this.#userId,
            quote: this.#quote
        }

    }
}