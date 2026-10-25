import { ConversionStatus } from "src/constants";
import Quote from "./Quote";

export default class Conversion {
    #id: string;
    #userId: string;
    #status: ConversionStatus;
    #key: string;
    #quote: Quote;
    constructor(
        id: string,
        userId: string,
        idempotencyKey: string,
        status: ConversionStatus,
        quote: Quote,
    ) {
        this.#id = id;
        this.#userId = userId;
        this.#status = status;
        this.#quote = quote;
        this.#key = idempotencyKey;
    }
    get id() {
        return this.#id;
    }
    get userId() {
        return this.#userId;
    }
    get quote() {
        return this.#quote;
    }
    get key() {
        return this.#key;
    }

    isCompleted() {
        return this.#status === ConversionStatus.COMPLETED;
    }

    toJSON() {
        return {
            id: this.#id,
            status: this.#status,
            userId: this.#userId,
            quote: this.#quote,
        };
    }
}
