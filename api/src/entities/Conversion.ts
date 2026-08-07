import type { ConversionStatus } from "src/types";

export default class Conversion {
    #id: string;
    #userId: string;
    #status: ConversionStatus;
    #quoteId: string
    constructor(userId: string, idempotencyKey: string, quoteId: string, status: ConversionStatus) {
        this.#userId = userId;
        this.#status = status;
        this.#quoteId = quoteId;
        this.#id = idempotencyKey;
    }
    get quoteId() {
        return this.#quoteId;
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
        }

    }
}