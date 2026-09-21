import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { ConversionsController } from "../conversions.controller";
import { ConversionsService } from "../conversions.service";
import { QuoteNotFoundError } from "src/errors/QuoteNotFoundError";
import { AlreadyConsumedQuoteError } from "src/errors/AlreadyConsumedQuoteError";
import Conversion from "src/entities/Conversion";
import { ConversionStatus, Currency } from "src/constants";
import Quote from "src/entities/Quote";
import Money from "src/entities/Money";

describe("Conversions", () => {
    let app: INestApplication;
    const conversionsService = {
        create: jest.fn(),
        createConversionToProvider: jest.fn(),
        findAll: jest.fn(),
    };

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [ConversionsController],
            providers: [
                {
                    provide: ConversionsService,
                    useValue: conversionsService,
                },
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
            }),
        );
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });

    describe("Create a new conversion", () => {
        const quoteId = "QUOTE-ID";
        const userId = "USER-ID";
        test("should return a 400 response if quote id is not provided", async () => {
            const response = await request(app.getHttpServer())
                .post("/conversions")
                .send({ userId });
            expect(response.status).toEqual(400);
        });
        test("should return a 400 response if idempotency key is not provided", async () => {
            const response = await request(app.getHttpServer())
                .post("/conversions")
                .send({ userId, quoteId });
            expect(response.status).toEqual(400);
        });
        test("should return a 404 response if no quote is found", async () => {
            conversionsService.create.mockRejectedValueOnce(
                new QuoteNotFoundError(quoteId),
            );
            const response = await request(app.getHttpServer())
                .post("/conversions")
                .set("X-Idempotency-Key", `test-${userId}-${quoteId}`)
                .send({ userId, quoteId });
            expect(response.status).toEqual(404);
            expect(response.body.message).toEqual("QUOTE_NOT_FOUND_ERROR");
        });
        // test("should return a 400 response if the quote is consumed", async () => {
        //     conversionsService.create.mockRejectedValueOnce(
        //         new AlreadyConsumedQuoteError(quoteId),
        //     );
        //     const response = await request(app.getHttpServer())
        //         .post("/conversions")
        //         .set("X-Idempotency-Key", `test-${userId}-${quoteId}`)
        //         .send({ userId, quoteId });
        //     expect(response.status).toEqual(400);
        //     expect(response.body.message).toEqual(
        //         "ALREADY_CONSUMED_QUOTE_ERROR",
        //     );
        // });
        test("should return a 201 response if the conversion was created", async () => {
            const idempotencyKey = `test-${userId}-${quoteId}`;
            conversionsService.create.mockResolvedValueOnce(
                new Conversion(
                    userId,
                    idempotencyKey,
                    new Quote(
                        "UUID",
                        Money.from(0, Currency.EUR),
                        Money.from(0, Currency.GBP),
                        0,
                        Money.from(1, Currency.EUR),
                    ),
                    ConversionStatus.CREATED,
                ),
            );
            const response = await request(app.getHttpServer())
                .post("/conversions")
                .set("X-Idempotency-Key", idempotencyKey)
                .send({ userId, quoteId });
            expect(response.status).toEqual(201);
            expect(response.body).toEqual(
                expect.objectContaining({
                    id: idempotencyKey,
                    status: ConversionStatus.CREATED,
                    userId,
                }),
            );
        });
    });
});
