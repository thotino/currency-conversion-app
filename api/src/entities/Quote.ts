import Money from "./Money";
import { MoneyInterface } from "src/types";
import { addSeconds, isPast } from "date-fns";
export default class Quote {
  #source: Money;
  #target: Money;
  #fees: Money;
  #rate: number;
  #createdAt: Date;
  #expiresAt: Date;
  constructor(
    source: Money,
    target: Money,
    rate: number,
    fees: Money,
    expiration?: Date,
  ) {
    this.#source = source;
    this.#target = target;
    this.#fees = fees;
    this.#rate = rate;
    this.#createdAt = new Date(Date.now());
    this.#expiresAt = expiration ?? addSeconds(this.#createdAt, 30);
  }
  isExpired() {
    return isPast(this.#expiresAt);
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
  get expiration() {
    return this.#expiresAt;
  }
  isEqual(other: Quote) {
    return (
      this.source.currency === other.source.currency &&
      this.source.amount === other.source.amount &&
      this.target.currency === other.target.currency &&
      this.target.amount === other.target.amount &&
      this.#rate === other.rate &&
      this.#expiresAt === other.expiration
    );
  }

  static from(
    source: MoneyInterface,
    target: MoneyInterface,
    fees: MoneyInterface,
    rate: number,
    expiration?: Date,
  ) {
    return new Quote(
      Money.from(source.amount, source.currency),
      Money.from(target.amount, target.currency),
      rate,
      Money.from(fees.amount, fees.currency),
      expiration,
    );
  }

  toJSON() {
    return {
      rate: this.#rate,
      source: this.#source,
      target: this.#target,
      fees: this.#fees,
      expiration: this.#expiresAt,
    };
  }
}
