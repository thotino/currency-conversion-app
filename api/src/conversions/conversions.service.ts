import { Injectable } from "@nestjs/common";
import Quote from "src/entities/Quote";
import { ProviderClient } from "src/provider/provider.client";
import { ConversionsRepository } from "./conversions.repository";
import { ExpiredQuoteError } from "src/errors/ExpiredQuoteError";
import { QuoteNotFoundError } from "src/errors/QuoteNotFoundError";
import { IdempotencyKeyViolationError } from "src/errors/IdempotencyKeyViolationError";
import { AlreadyConsumedQuoteError } from "src/errors/AlreadyConsumedQuoteError";

@Injectable()
export class ConversionsService {
    constructor(
        readonly providerClient: ProviderClient,
        readonly conversionRepository: ConversionsRepository,
    ) {}
    async create(userId: string, quoteId: string, idempotencyKey: string) {
        const existingConversion =
            await this.conversionRepository.findByKey(idempotencyKey);
        if (existingConversion != null) {
            if (
                existingConversion.userId !== userId ||
                existingConversion.quote.id !== quoteId
            ) {
                throw new IdempotencyKeyViolationError(idempotencyKey);
            }
            return existingConversion;
        }

        const { quote, conversion, created } =
            await this.conversionRepository.createConversion(
                quoteId,
                idempotencyKey,
                userId,
            );
        if (quote == null) {
            throw new QuoteNotFoundError(quoteId);
        }
        if (conversion == null) {
            if (quote.isExpired()) {
                throw new ExpiredQuoteError(quote.expiration.toISOString());
            }
            if (quote.isConsumed()) {
                throw new AlreadyConsumedQuoteError(quote.id);
            }
        }
        if (conversion?.userId !== userId || conversion?.quote.id !== quoteId) {
            throw new IdempotencyKeyViolationError(idempotencyKey);
        }
        return conversion;
    }
    async createConversionToProvider(idempotencyKey: string, quote: Quote) {
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
}
