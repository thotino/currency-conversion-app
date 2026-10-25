import { Injectable } from "@nestjs/common";
import Quote from "src/entities/Quote";
import { ProviderClient } from "src/provider/provider.client";
import { ConversionsRepository } from "./conversions.repository";
import { ExpiredQuoteError } from "src/errors/ExpiredQuoteError";
import { QuoteNotFoundError } from "src/errors/QuoteNotFoundError";
import { IdempotencyKeyViolationError } from "src/errors/IdempotencyKeyViolationError";
import { AlreadyConsumedQuoteError } from "src/errors/AlreadyConsumedQuoteError";
import { ConversionStatus } from "src/constants";
import { SubmissionResult } from "src/types";

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
    async submitToProvider(
        identifier: string,
        quote: Quote,
    ): Promise<SubmissionResult> {
        try {
            const submissionResult = await this.providerClient.submitConversion(
                identifier,
                quote.source.amount,
                quote.source.currency,
                quote.target.currency,
            );
            if (submissionResult.status === 202) {
                if (
                    submissionResult.message.providerRef != null &&
                    typeof submissionResult.message.providerRef === "string" &&
                    submissionResult.message.providerRef.length != 0
                ) {
                    return {
                        kind: ConversionStatus.SUBMITTED,
                        id: identifier,
                        providerRef: submissionResult.message.providerRef,
                    };
                }
                return {
                    kind: ConversionStatus.UNKNOWN,
                    id: identifier,
                    reason: submissionResult.message,
                };
            }
            if (
                submissionResult.status === 400 &&
                submissionResult.message != null
            ) {
                return {
                    kind: ConversionStatus.REJECTED,
                    id: identifier,
                    reason: submissionResult.message,
                };
            }
            if (
                submissionResult.status > 400 &&
                submissionResult.status < 500 &&
                submissionResult.message != null
            ) {
                return {
                    kind: ConversionStatus.UNKNOWN,
                    id: identifier,
                    reason: submissionResult.message,
                };
            }
            return {
                kind: ConversionStatus.UNKNOWN,
                id: identifier,
                reason: submissionResult.message,
            };
        } catch (error) {
            let message = "ERR_UNEXPECTED_ERROR";
            if (error instanceof Error) {
                message = error.message;
            }
            return {
                kind: ConversionStatus.UNKNOWN,
                id: identifier,
                reason: message,
            };
        }
    }
    async updateAfterSubmission(submissionAttemptOutcomes: SubmissionResult[]) {
        await this.conversionRepository.updateAfterSubmissionAttempt(
            submissionAttemptOutcomes,
        );
    }
    async findCreated() {
        return await this.conversionRepository.findCreated();
    }
    async findAll(userId: string) {
        return await this.conversionRepository.findAll(userId);
    }
    async findOneByKey(idempotencyKey: string) {
        return await this.conversionRepository.findByKey(idempotencyKey);
    }
}
