import { ConversionStatus } from "src/constants";
import Quote from "./Quote";

export default class Conversion {
  #id: string;
  #userId: string;
  #status: ConversionStatus;
  #quote: Quote;
  constructor(
    userId: string,
    idempotencyKey: string,
    quote: Quote,
    status: ConversionStatus,
  ) {
    this.#userId = userId;
    this.#status = status;
    this.#quote = quote;
    this.#id = idempotencyKey;
  }
  get id() {
    return this.#id;
  }
  get userId() {
    return this.#userId;
  }
  get quote() {
    return this.#quote;
  }

  isCompleted() {
    return this.#status === ConversionStatus.COMPLETED;
  }

  toJSON() {
    return {
      id: this.#id,
      status: this.#status,
      userId: this.#userId,
      quote: this.#quote,
    };
  }
}
