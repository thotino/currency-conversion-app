export class ExpiredQuoteError extends Error {
    code: string = "EXPIRED_QUOTE";
    value: { expiration: string };
    constructor(expirationDate: string) {
        const message = "The quote for this conversion is outdated";
        super(message);
        this.value = { expiration: expirationDate };
    }
}
