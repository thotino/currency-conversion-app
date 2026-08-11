export class NegativeAmountMoneyOperationError extends Error {
    code: string = "NEGATIVE_MONEY_AMOUNT_OPERATION_ERROR";
    constructor() {
        const msg = "Cannot create neagtive amount money";
        super(msg);
    }
}
