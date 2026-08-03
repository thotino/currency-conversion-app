import Quote from "./Quote";

type ConversionStatus = "PENDING" | "COMPLETED" | "FAILED";
export default class Conversion {
    #id: string;
    #userId: string;
    #status: ConversionStatus;
    #quote: Quote
    #createdAt: Date;
    constructor(userId: string, quote: Quote) {
        if (quote.isExpired()) {
            throw new Error("EXPIRED QUOTE");
        }
        this.#createdAt = new Date(Date.now());
        this.#userId = userId;
        this.#status = "PENDING";
        this.#quote = quote;
        this.#id = `conversion-${userId}-${quote.source.currency}-${quote.target.currency}-${this.#createdAt.valueOf()}`
    }
    markAsCompleted() {
        this.#status = "COMPLETED";
    }
    markAsFailed() {
        this.#status = "FAILED";
    }
}