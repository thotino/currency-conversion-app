import { Injectable } from "@nestjs/common";
import { Quote as QuoteModel } from "./models/quotes.model";
import { InjectModel } from "@nestjs/sequelize";
import { randomUUID } from "node:crypto";
import { MoneyInterface } from "src/types";
import Quote from "src/entities/Quote";
import Money from "src/entities/Money";

@Injectable()
export class QuotesRepository {
  constructor(
    @InjectModel(QuoteModel) readonly quoteModel: typeof QuoteModel,
  ) {}
  private static format(instance: QuoteModel | null) {
    if (instance == null) return null;
    return new Quote(
      instance.id,
      Money.from(instance.source.amount, instance.source.currency),
      Money.from(instance.target.amount, instance.target.currency),
      instance.rate,
      Money.from(instance.fees.amount, instance.fees.currency),
      instance.expires_at,
    );
  }
  async create(
    source: MoneyInterface,
    target: MoneyInterface,
    fees: MoneyInterface,
    rate: number,
    expiration: Date,
  ) {
    const createdQuote = await this.quoteModel.create({
      id: randomUUID(),
      source,
      target,
      fees,
      rate,
      expires_at: expiration,
    });
    return QuotesRepository.format(createdQuote);
  }
  async findOne(id: string) {
    const retrievedInstance = await this.quoteModel.findByPk(id);
    return QuotesRepository.format(retrievedInstance);
  }
}
