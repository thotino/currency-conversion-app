import { describe, beforeAll, afterAll, test, expect, vi } from "vitest";
import { Test } from "@nestjs/testing";
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
vi.mock("src/provider/provider.client");
vi.mock("src/conversions/conversions.repository");
describe("Conversions", () => {
    const providerClient = {
        submitConversion: vi.fn(),
    };
    const conversionsRepository = {
        createConversion: vi.fn(),
        findByKey: vi.fn(),
    };
    let conversionsService: ConversionsService;
    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                ConversionsService,
                { provide: ProviderClient, useValue: providerClient },
                {
                    provide: ConversionsRepository,
                    useValue: conversionsRepository,
                },
            ],
        }).compile();
        conversionsService = moduleRef.get(ConversionsService);
    });
    const userId = "MY-USER-ID";
    const quoteId = "MY-QUOTE-ID";
    const idempotencyKey = "RANDOM-KEY";
    describe("create a new conversion", () => {
        const now = new Date("2026-01-01T23:30");
        beforeAll(() => {
            vi.clearAllMocks();
            vi.useFakeTimers({ now });
        });
        afterAll(() => {
            vi.useRealTimers();
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
    describe("create conversion to provider", () => {
        const now = new Date("2026-01-01T23:30");
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
            ConversionStatus.SUBMITTING,
            validQuote,
        );
        const providerRef = "prv_01";
        test("should return a valid submission result", async () => {
            providerClient.submitConversion.mockResolvedValueOnce({
                status: 202,
                message: { providerRef },
            });
            const submissionAttemptResult =
                await conversionsService.submitToProvider(
                    conversion.id,
                    validQuote,
                );
            expect(submissionAttemptResult).toEqual({
                kind: ConversionStatus.SUBMITTED,
                id: conversion.id,
                providerRef,
            });
        });
        test("should return a valid submission result", async () => {
            providerClient.submitConversion.mockResolvedValueOnce({
                status: 202,
                message: { providerRef: null },
            });
            const submissionAttemptResult =
                await conversionsService.submitToProvider(
                    conversion.id,
                    validQuote,
                );
            expect(submissionAttemptResult).toEqual({
                kind: ConversionStatus.UNKNOWN,
                id: conversion.id,
                reason: { providerRef: null },
            });
        });
        test("should return a valid submission result - unknown status with null message", async () => {
            providerClient.submitConversion.mockResolvedValueOnce({
                status: 202,
                message: null,
            });
            const submissionAttemptResult =
                await conversionsService.submitToProvider(
                    conversion.id,
                    validQuote,
                );
            expect(submissionAttemptResult).toEqual({
                kind: ConversionStatus.UNKNOWN,
                id: conversion.id,
                reason: null,
            });
        });
        test("should return a valid submission result - unknown status with unexpected message", async () => {
            providerClient.submitConversion.mockResolvedValueOnce({
                status: 202,
                message: "can't provide a ref for now!",
            });
            const submissionAttemptResult =
                await conversionsService.submitToProvider(
                    conversion.id,
                    validQuote,
                );
            expect(submissionAttemptResult).toEqual({
                kind: ConversionStatus.UNKNOWN,
                id: conversion.id,
                reason: "can't provide a ref for now!",
            });
        });
        test("should return a valid submission result - rejected status with invalidation message", async () => {
            providerClient.submitConversion.mockResolvedValueOnce({
                status: 400,
                message: "invalid rate for conversion!",
            });
            const submissionAttemptResult =
                await conversionsService.submitToProvider(
                    conversion.id,
                    validQuote,
                );
            expect(submissionAttemptResult).toEqual({
                kind: ConversionStatus.REJECTED,
                id: conversion.id,
                reason: "invalid rate for conversion!",
            });
        });
    });
});
