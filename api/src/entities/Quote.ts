import Money from "./Money";
import { MoneyInterface } from "src/types";
import { addSeconds, isPast } from "date-fns";
export default class Quote {
  #id: string;
  #source: Money;
  #target: Money;
  #fees: Money;
  #rate: number;
  #consumed: boolean;
  #expiresAt: Date;
  constructor(
    id: string,
    source: Money,
    target: Money,
    rate: number,
    fees: Money,
    expiration?: Date,
    consumed: boolean = false
  ) {
    this.#id = id;
    this.#source = source;
    this.#target = target;
    this.#fees = fees;
    this.#rate = rate;
    this.#expiresAt = expiration ?? addSeconds(new Date(Date.now()), 30);
    this.#consumed = consumed
  }
  isExpired() {
    return isPast(this.#expiresAt);
  }
  isConsumed() {
    return this.#consumed === true
  }
  get id() {
    return this.#id;
  }
  get source() {
    return this.#source;
  }
  get target() {
    return this.#target;
  }
  get rate() {
    return this.#rate;
  }
  get fees() { 
    return this.#fees;
   }
  get expiration() {
    return this.#expiresAt;
  }

  static from(
    id: string,
    source: MoneyInterface,
    target: MoneyInterface,
    fees: MoneyInterface,
    rate: number,
    expiration: Date,
    consumed: boolean,
  ) {
    return new Quote(
      id,
      Money.from(source.amount, source.currency),
      Money.from(target.amount, target.currency),
      rate,
      Money.from(fees.amount, fees.currency),
      expiration,
      consumed
    );
  }

  toJSON() {
    return {
      id: this.#id,
      rate: this.#rate,
      source: this.#source,
      target: this.#target,
      fees: this.#fees,
      expiration: this.#expiresAt,
    };
  }
}
