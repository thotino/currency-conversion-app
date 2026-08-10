import { Currency } from "src/constants";
import Money from "./Money";
import Conversion from "./Conversion";

export default class Balance {
  #userId: string;
  #balanceByCurrency: Map<Currency, Money>;
  constructor(userId: string, moneyByCurrency: Map<Currency, Money>) {
    this.#userId = userId;
    this.#balanceByCurrency = new Map<Currency, Money>();
    for (const currency of Object.values(Currency) as Currency[]) {
      const money = moneyByCurrency.get(currency) ?? Money.from(0, currency);
      this.#balanceByCurrency.set(currency, money);
    }
  }
  applyConversion(conversion: Conversion) {
    const source = conversion.quote.source;
    const target = conversion.quote.target;
    const fee = conversion.quote.fees;
    this.#balanceByCurrency.set(
      source.currency,
      this.#balanceByCurrency.get(source.currency)!.subtract(source),
    );
    this.#balanceByCurrency.set(
      target.currency,
      this.#balanceByCurrency.get(target.currency)!.add(target),
    );
    this.#balanceByCurrency.set(
      fee.currency,
      this.#balanceByCurrency.get(fee.currency)!.subtract(fee),
    );
    return this;
  }
  get userId() {
    return this.#userId;
  }
  get balanceByCurrency() {
    return this.#balanceByCurrency;
  }
  toJSON() {
    const balance: Partial<Record<Currency, number>> = {};
    for (const [currency, money] of [...this.#balanceByCurrency.entries()]) {
      balance[currency] = money.amount;
    }
    return {
      userId: this.#userId,
      balance,
    };
  }
}
