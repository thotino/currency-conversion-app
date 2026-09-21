import { Injectable } from "@nestjs/common";
import Quote from "src/entities/Quote";
import { ProviderClient } from "src/provider/provider.client";
import { ConversionsRepository } from "./conversions.repository";
import { ExpiredQuoteError } from "src/errors/ExpiredQuoteError";
import { QuoteNotFoundError } from "src/errors/QuoteNotFoundError";

@Injectable()
export class ConversionsService {
    constructor(
        readonly providerClient: ProviderClient,
        readonly conversionRepository: ConversionsRepository,
    ) {}
    async create(userId: string, quoteId: string, idempotencyKey: string) {
        const {
            quote,
            conversion, created
        } = await this.conversionRepository.createConversionReservation(
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
        return conversion;
        //TODO: check if balance is ok for this conversion.
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
