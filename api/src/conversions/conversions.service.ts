import { Injectable } from "@nestjs/common";
import Quote from "src/entities/Quote";
import { ProviderClient } from "src/provider/provider.client";
import { ConversionsRepository } from "./conversions.repository";
import { QuoteInterface } from "src/types";
class IdempotencyKeyViolationError extends Error {
    code: string = "DUPLICATED_IDEMPOTENCY_KEY"; 
    value: {key: string};
    constructor(key: string) {
        const message = "Conversion for this key already exists"
        super(message)
        this.value = {key}
    }
}
class ExpiredQuoteError extends Error {
    code: string = "EXPIRED_QUOTE"; 
    value: {};
    constructor() {
        const message = "The quote for this conversion is outdated"
        super(message)
        this.value = {}
    }
}
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
            throw new ExpiredQuoteError()
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
}