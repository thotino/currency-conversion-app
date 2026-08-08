export class AlreadyConsumedQuoteError extends Error {
    code: string = "ALREADY_CONSUMED_QUOTE_ERROR";
    value: { id: string }
    constructor(id: string) {
        const msg: string = "This quote is already consumed"
        super(msg)
        this.value = { id }
    }
}