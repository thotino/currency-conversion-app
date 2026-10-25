import { ConversionsRepository } from "../conversions.repository";
import { ConversionsService } from "../conversions.service";
import { ProviderClient } from "src/provider/provider.client";
import { QuoteNotFoundError } from "src/errors/QuoteNotFoundError";
import Quote from "src/entities/Quote";
import Money from "src/entities/Money";
import { ConversionStatus, Currency } from "src/constants";
import { AlreadyConsumedQuoteError } from "src/errors/AlreadyConsumedQuoteError";
import { ExpiredQuoteError } from "src/errors/ExpiredQuoteError";
import Conversion from "src/entities/Conversion";
import { IdempotencyKeyViolationError } from "src/errors/IdempotencyKeyViolationError";

describe("Conversions", () => {
    // @ts-expect-error
    const providerClient: jest.Mocked<ProviderClient> = {
        baseUrl: "http://provider/",
        submitConversion: jest.fn(),
    };
    // @ts-expect-error
    const conversionsRepository: jest.Mocked<ConversionsRepository> = {
        createConversion: jest.fn(),
        findByKey: jest.fn(),
    };
    const conversionsService = new ConversionsService(
        providerClient,
        conversionsRepository,
    );
    const userId = "MY-USER-ID";
    const quoteId = "MY-QUOTE-ID";
    const idempotencyKey = "RANDOM-KEY";
    describe("create a new conversion", () => {
        const now = new Date("2026-01-01T23:30");
        beforeAll(() => {
            jest.clearAllMocks();
            jest.useFakeTimers({ now });
        });
        afterAll(() => {
            jest.useRealTimers();
        });
        const expiredQuote = new Quote(
            "UUID",
            Money.from(1, Currency.EUR),
            Money.from(1, Currency.GBP),
            1,
            Money.from(1, Currency.EUR),
            new Date("2026-01-01T23:00"),
        );
        const consumedQuote = new Quote(
            "UUID",
            Money.from(1, Currency.EUR),
            Money.from(1, Currency.GBP),
            1,
            Money.from(1, Currency.EUR),
            now,
            true,
        );
        const validQuote = new Quote(
            quoteId,
            Money.from(1, Currency.EUR),
            Money.from(1, Currency.GBP),
            1,
            Money.from(1, Currency.EUR),
            now,
            true,
        );
        const conversion = new Conversion(
            "id",
            userId,
            idempotencyKey,
            ConversionStatus.CREATED,
            validQuote,
        );
        test("should throw an error if quote is not found", async () => {
            conversionsRepository.createConversion.mockResolvedValueOnce({
                quote: null,
                created: false,
                conversion: null,
            });
            await expect(
                conversionsService.create(userId, quoteId, idempotencyKey),
            ).rejects.toThrow(QuoteNotFoundError);
        });
        test("should throw an error if the retrieved quote is expired", async () => {
            conversionsRepository.createConversion.mockResolvedValueOnce({
                quote: expiredQuote,
                created: false,
                conversion: null,
            });
            await expect(
                conversionsService.create(userId, quoteId, idempotencyKey),
            ).rejects.toThrow(ExpiredQuoteError);
        });
        // test("should throw an error if the retrieved quote was already consumed", async () => {
        //     conversionsRepository.createConversionReservation.mockResolvedValueOnce(
        //         {
        //             quote: consumedQuote,
        //             created: false,
        //             existingConversion: null,
        //             createdConversion: null,
        //             isQuotePreviouslyConsumed: true,
        //         },
        //     );
        //     await expect(
        //         conversionsService.create(userId, quoteId, idempotencyKey),
        //     ).rejects.toThrow(AlreadyConsumedQuoteError);
        // });
        test("should return the existing conversion", async () => {
            conversionsRepository.findByKey.mockResolvedValueOnce(conversion);
            await expect(
                conversionsService.create(userId, quoteId, idempotencyKey),
            ).resolves.toEqual(conversion);
            expect(
                conversionsRepository.createConversion,
            ).not.toHaveBeenCalled();
        });
        test("should raise an idempotency key violation error if key exists for an other user", async () => {
            const existingConversion = new Conversion(
                "ID",
                "UUID",
                idempotencyKey,
                ConversionStatus.CREATED,
                validQuote,
            );
            conversionsRepository.findByKey.mockResolvedValueOnce(
                existingConversion,
            );
            await expect(
                conversionsService.create(userId, quoteId, idempotencyKey),
            ).rejects.toThrow(IdempotencyKeyViolationError);
            expect(
                conversionsRepository.createConversion,
            ).not.toHaveBeenCalled();
        });
        test("should raise an idempotency key violation error if key exists for an other quote", async () => {
            const existingConversion = new Conversion(
                "id",
                userId,
                idempotencyKey,
                ConversionStatus.CREATED,
                expiredQuote,
            );
            conversionsRepository.findByKey.mockResolvedValueOnce(
                existingConversion,
            );
            await expect(
                conversionsService.create(userId, quoteId, idempotencyKey),
            ).rejects.toThrow(IdempotencyKeyViolationError);
            expect(
                conversionsRepository.createConversion,
            ).not.toHaveBeenCalled();
        });
        test("should throw an error if quote is not found", async () => {
            conversionsRepository.findByKey.mockResolvedValueOnce(null);
            conversionsRepository.createConversion.mockResolvedValueOnce({
                quote: null,
                conversion: null,
                created: false,
            });
            await expect(
                conversionsService.create(userId, quoteId, idempotencyKey),
            ).rejects.toThrow(QuoteNotFoundError);
        });
        test("should throw an error if quote is expired", async () => {
            conversionsRepository.findByKey.mockResolvedValueOnce(null);
            conversionsRepository.createConversion.mockResolvedValueOnce({
                quote: expiredQuote,
                conversion: null,
                created: false,
            });
            await expect(
                conversionsService.create(userId, quoteId, idempotencyKey),
            ).rejects.toThrow(ExpiredQuoteError);
        });
        test("should throw an error if quote is already consumed", async () => {
            conversionsRepository.findByKey.mockResolvedValueOnce(null);
            conversionsRepository.createConversion.mockResolvedValueOnce({
                quote: consumedQuote,
                conversion: null,
                created: false,
            });
            await expect(
                conversionsService.create(userId, quoteId, idempotencyKey),
            ).rejects.toThrow(AlreadyConsumedQuoteError);
        });
        test("should return the created conversion", async () => {
            conversionsRepository.findByKey.mockResolvedValueOnce(null);
            conversionsRepository.createConversion.mockResolvedValueOnce({
                quote: validQuote,
                conversion: conversion,
                created: true,
            });
            await expect(
                conversionsService.create(userId, quoteId, idempotencyKey),
            ).resolves.toEqual(conversion);
        });
        test("should throw an error if quote is valid but conversion is for another user", async () => {
            const existingConversion = new Conversion(
                "ID",
                "UUID",
                idempotencyKey,
                ConversionStatus.CREATED,
                validQuote,
            );
            conversionsRepository.findByKey.mockResolvedValueOnce(null);
            conversionsRepository.createConversion.mockResolvedValueOnce({
                quote: validQuote,
                conversion: existingConversion,
                created: true,
            });
            await expect(
                conversionsService.create(userId, quoteId, idempotencyKey),
            ).rejects.toThrow(IdempotencyKeyViolationError);
        });
    });
    describe("create conversion to provider", () => {});
});
