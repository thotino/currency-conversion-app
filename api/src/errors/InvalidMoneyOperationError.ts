export class InvalidMoneyOperationError extends Error {
    code: string = "DIFFERENT_CURRENCIES_OPERATION_ERROR";
    constructor() {
        const msg = "Cannot perform money operation in different currencies";
        super(msg);
    }
}
