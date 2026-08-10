import { Injectable } from "@nestjs/common";
import Quote from "src/entities/Quote";
import { ProviderClient } from "src/provider/provider.client";
import { ConversionsRepository } from "./conversions.repository";
import Conversion from "src/entities/Conversion";
import { ExpiredQuoteError } from "src/errors/ExpiredQuoteError";
import { QuoteNotFoundError } from "src/errors/QuoteNotFoundError";
import { QuotesRepository } from "src/quotes/quotes.repository";
import { AlreadyConsumedQuoteError } from "src/errors/AlreadyConsumedQuoteError";

@Injectable()
export class ConversionsService {
  constructor(
    readonly providerClient: ProviderClient,
    readonly quotesRepository: QuotesRepository,
    readonly conversionRepository: ConversionsRepository,
  ) {}
  async create(userId: string, quoteId: string, idempotencyKey: string) {
    const { quote, existingConversion, createdConversion, isQuotePreviouslyConsumed } =
      await this.conversionRepository.createConversionReservation(
        quoteId,
        idempotencyKey,
        userId,
      );
    if (quote == null) {
      throw new QuoteNotFoundError(quoteId);
    }
    if (quote.isExpired()) {
      throw new ExpiredQuoteError(quote.expiration.toISOString());
    }
    if (isQuotePreviouslyConsumed === true) {
      throw new AlreadyConsumedQuoteError(quote.id);
    }
    if (existingConversion != null) {
      return existingConversion;
    }
    return createdConversion;
    //TODO: check if balance is ok for this conversion.
  }
  async createConversionToProvider(
    idempotencyKey: string,
    quote: Quote,
  ) {
    try {
      const { providerRef } = await this.providerClient.createConversion(
        idempotencyKey,
        quote.source.amount,
        quote.source.currency,
        quote.target.currency,
      );

      return await this.conversionRepository.updateWithProviderRefAndStatus(
        idempotencyKey,
        providerRef,
      );
    } catch (error) {
      await this.conversionRepository.markFailed(idempotencyKey);
      throw error;
    }
  }
  async *findCreated() {
    for await (const conversion of this.conversionRepository.findCreated()) {
      yield conversion;
    }

  }
  async findAll(userId: string) {
    return await this.conversionRepository.findAll(userId);
  }
  async findOneByKey(idempotencyKey: string) {
    return await this.conversionRepository.findByKey(idempotencyKey);
  }
  async updateOne(conversion: Conversion) {
    return await this.conversionRepository.update(conversion);
  }
}
