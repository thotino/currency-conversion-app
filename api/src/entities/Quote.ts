import Money from "./Money";
import { addSeconds, isPast } from "date-fns";
export default class Quote {
    #source: Money;
    #target: Money;
    #fees: Money;
    #rate: number;
    #createdAt: Date;
    #expiresAt: Date;
    constructor(source: Money, target: Money, rate: number, fees: Money) {
        this.#source = source;
        this.#target = target;
        this.#fees  = fees;
        this.#rate = rate;
        this.#createdAt = new Date(Date.now());
        this.#expiresAt = addSeconds(this.#createdAt, 30);         
    }
    isExpired() {
        return isPast(this.#expiresAt);
    }
    get source() { return this.#source; }
    get target() { return this.#target; }
    
    toJSON() {
        return {
            rate: this.#rate,
            source: `${this.#source.amount} ${this.#source.currency}`,
            target: `${this.#target.amount} ${this.#target.currency}`,
            expiration: this.#expiresAt,
        }

    }
}