import { ServiceErrorInterface } from "src/errors";

export class QuoteNotFoundError extends Error implements ServiceErrorInterface {
    code: string = "QUOTE_NOT_FOUND_ERROR";
    value: { id: string };
    constructor(id: string) {
        const msg: string = "This quote is not found";
        super(msg);
        this.value = { id };
    }
}
