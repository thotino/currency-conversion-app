import { Currency } from "src/constants"
export class InvalidOperationError extends Error {
    constructor(msg: string) {
        super(msg)
    }
}
export default class Money {
    constructor(public readonly amount: number, public readonly currency: Currency) {
        if (amount < 0) {throw new InvalidOperationError("Cannot create negative amount money")}
        this.amount = amount
        this.currency = currency
    }
    add(other: Money) {
        if (this.currency != other.currency) {
            throw new InvalidOperationError("Cannot perform money operation in different currencies")
        }
        return new Money(this.amount + other.amount, this.currency)
    }

    subtract(other: Money) {
        if (this.currency != other.currency) {
            throw new InvalidOperationError("Cannot perform money operation in different currencies")
        }
        return new Money(this.amount - other.amount, this.currency)
    }
    isZero() {
        return this.amount === 0
    }
    isGreaterThanOrEqual(other: Money) {
        if (this.currency != other.currency) {
            throw new InvalidOperationError("Cannot compare money in different currencies")
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