import { ServiceErrorInterface } from "src/errors";

export class NegativeAmountMoneyOperationError
    extends Error
    implements ServiceErrorInterface
{
    code: string = "NEGATIVE_MONEY_AMOUNT_OPERATION_ERROR";
    constructor() {
        const msg = "Cannot create neagtive amount money";
        super(msg);
    }
}
