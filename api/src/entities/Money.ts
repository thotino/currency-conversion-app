import { Currency } from "src/constants"
import { InvalidMoneyOperationError } from "src/errors/InvalidMoneyOperationError";
import { NegativeAmountMoneyOperationError } from "src/errors/NegativeAmountMoneyOperationError";

export default class Money {
    constructor(public readonly amount: number, public readonly currency: Currency) {
        if (amount < 0) {throw new NegativeAmountMoneyOperationError()}
        this.amount = amount
        this.currency = currency
    }
    add(other: Money) {
        if (this.currency != other.currency) {
            throw new InvalidMoneyOperationError()
        }
        return new Money(this.amount + other.amount, this.currency)
    }

    subtract(other: Money) {
        if (this.currency != other.currency) {
            throw new InvalidMoneyOperationError()
        }
        return new Money(this.amount - other.amount, this.currency)
    }
    isZero() {
        return this.amount === 0
    }
    isGreaterThanOrEqual(other: Money) {
        if (this.currency != other.currency) {
            throw new InvalidMoneyOperationError()
        }
        return this.amount >= other.amount;
    }
    static from(amount: number, currency: Currency) {
        return new Money(amount, currency);
    }
    toJSON() {
        return {
            amount: this.amount,
            currency: this.currency
        }
    }
}