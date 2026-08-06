import { Injectable } from "@nestjs/common";
import Quote from "src/entities/Quote";
import { ProviderClient } from "src/provider/provider.client";
import { ConversionsRepository } from "./conversions.repository";
import { QuoteInterface } from "src/types";
import Conversion from "src/entities/Conversion";
import { ExpiredQuoteError } from "src/errors/ExpiredQuoteError";
import { IdempotencyKeyViolationError } from "src/errors/IdempotencyKeyViolationError";

@Injectable()
export class ConversionsService {
    constructor(readonly providerClient: ProviderClient, readonly conversionRepository: ConversionsRepository) {}
    async create(userId: string, quoteFromRequest: QuoteInterface, idempotencyKey: string) {
        const quote = Quote.from(quoteFromRequest.source, quoteFromRequest.target, quoteFromRequest.fees, quoteFromRequest.rate, quoteFromRequest.expiration)
        const existingConversion = await this.conversionRepository.findByKey(idempotencyKey);
        if (existingConversion != null) {
            const existingConversionQuote = existingConversion.quote;
            if (quote.isEqual(existingConversionQuote)) {
                throw new IdempotencyKeyViolationError(idempotencyKey)
            }
        }
        if (quote.isExpired()) {
            throw new ExpiredQuoteError(quote.expiration.toISOString())
        }
        const { providerRef } = await this.providerClient.createConversion(idempotencyKey, quoteFromRequest.source.amount, quoteFromRequest.source.currency, quoteFromRequest.target.currency)
        const conversion = await this.conversionRepository.create(idempotencyKey, userId, quote, providerRef, "PENDING")
        return conversion;
    }
    async findAll(userId: string) {
        return await this.conversionRepository.findAll(userId)
    }
    async findOne(idempotencyKey: string, providerRef: string) {
        return await this.conversionRepository.findByKeyAndRef(idempotencyKey, providerRef);
    }
    async updateOne(conversion: Conversion) {
        return await this.conversionRepository.update(conversion);
    }
}