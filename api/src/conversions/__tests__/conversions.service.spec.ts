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

describe("Conversions", () => {
    // @ts-expect-error
    const providerClient: jest.Mocked<ProviderClient> = {
        baseUrl: "http://provider/",
        createConversion: jest.fn(),
    };
    // @ts-expect-error
    const conversionsRepository: jest.Mocked<ConversionsRepository> = {
        createConversionReservation: jest.fn(),
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
            jest.useFakeTimers({now})
        })
        afterAll(() => {
            jest.useRealTimers()
        })
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
            now, true
        );
        const validQuote = new Quote(
            "UUID",
            Money.from(1, Currency.EUR),
            Money.from(1, Currency.GBP),
            1,
            Money.from(1, Currency.EUR),
            now, true
        );
        const conversion = new Conversion(userId, idempotencyKey, expiredQuote, ConversionStatus.CREATED)
        test("should throw an error if quote is not found", async () => {
            conversionsRepository.createConversionReservation.mockResolvedValueOnce(
                { quote: null, created: false, existingConversion: null },
            );
            await expect(
                conversionsService.create(userId, quoteId, idempotencyKey),
            ).rejects.toThrow(QuoteNotFoundError);
        });
        test("should throw an error if the retrieved quote is expired", async () => {
            conversionsRepository.createConversionReservation.mockResolvedValueOnce(
                { quote: expiredQuote, created: false, existingConversion: null },
            );
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
            conversionsRepository.createConversionReservation.mockResolvedValueOnce(
                {
                    quote: validQuote,
                    created: false,
                    existingConversion: conversion,
                },
            );
            await expect(
                conversionsService.create(userId, quoteId, idempotencyKey),
            ).resolves.toEqual(conversion);
        });
    });
    describe("create conversion to provider", () => {});
});
