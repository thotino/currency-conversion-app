import { Injectable } from "@nestjs/common";
import Quote from "src/entities/Quote";
import { ProviderClient } from "src/provider/provider.client";
import { ConversionsRepository } from "./conversions.repository";
import { QuoteInterface } from "src/types";
import Conversion from "src/entities/Conversion";
import { ExpiredQuoteError } from "src/errors/ExpiredQuoteError";
import { IdempotencyKeyViolationError } from "src/errors/IdempotencyKeyViolationError";
import { QuotesRepository } from "src/quotes/quotes.repository";
class AlreadyConsumedQuoteError extends Error {
    code: string = "ALREADY_CONSUMED_QUOTE_ERROR";
    value: { id: string }
    constructor(id: string) {
        const msg: string = "This quote is already consumed"
        super(msg)
        this.value = { id }
    }
}
class QuoteNotFoundError extends Error {
    code: string = "QUOTE_NOT_FOUND_ERROR";
    value: { id: string }
    constructor(id: string) {
        const msg: string = "This quote is not found"
        super(msg)
        this.value = { id }
    }
}

class ExistingConversionQuoteNotFoundError extends Error {
    code: string = "QUOTE_NOT_FOUND_ERROR";
    value: { conversionId: string, quoteId: string }
    constructor(conversionId: string, quoteId: string) {
        const msg: string = "This quote is not found"
        super(msg)
        this.value = { conversionId, quoteId }
    }
}
@Injectable()
export class ConversionsService {
    constructor(readonly providerClient: ProviderClient, readonly quotesRepository: QuotesRepository, readonly conversionRepository: ConversionsRepository) {}
    async create(userId: string, quoteId: string, idempotencyKey: string) {
        const quote = await this.quotesRepository.findOne(quoteId);
        if (quote == null) {
            throw new QuoteNotFoundError(quoteId)
        }
        if (quote.isExpired()) {
            throw new ExpiredQuoteError(quote.expiration.toISOString())
        }
        if (quote.isConsumed()) {
            throw new AlreadyConsumedQuoteError(quote.id)
        }
        const existingConversion = await this.conversionRepository.findByKey(idempotencyKey);
        if (existingConversion != null) {
            return existingConversion;
        }
        //TODO: check if balance is ok.
        const { providerRef } = await this.providerClient.createConversion(idempotencyKey, quote.source.amount, quote.source.currency, quote.target.currency)
        const conversion = await this.conversionRepository.create(idempotencyKey, userId, quote.id, providerRef, "PENDING")
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