import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { QuotesController } from "../quotes.controller";
import { QuotesService } from "../quotes.service";
import { Currency } from "src/constants";
import Quote from "src/entities/Quote";
import Money from "src/entities/Money";

describe("Quotes", () => {
    let app: INestApplication;
    const quotesService = {
        create: jest.fn(),
    };
    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [QuotesController],
            providers: [
                {
                    provide: QuotesService,
                    useValue: quotesService,
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

    describe("Create a new quote", () => {
        test("should return a 400 response if no required property is provided", async () => {
            const response = await request(app.getHttpServer())
                .post("/quotes")
                .send();
            expect(response.status).toEqual(400);
        });
        test("should return a 201 response if no required property is provided", async () => {
            quotesService.create.mockResolvedValueOnce(
                new Quote(
                    "UUID",
                    Money.from(1, Currency.EUR),
                    Money.from(1, Currency.GBP),
                    0,
                    Money.from(1, Currency.EUR),
                ),
            );
            const response = await request(app.getHttpServer())
                .post("/quotes")
                .send({
                    amount: 10,
                    sourceCurrency: Currency.EUR,
                    targetCurrency: Currency.GBP,
                });
            expect(response.status).toEqual(201);
            expect(response.body).toEqual(
                expect.objectContaining({
                    id: "UUID",
                    rate: 0,
                    source: expect.objectContaining({
                        amount: 1,
                        currency: Currency.EUR,
                    }),
                    target: expect.objectContaining({
                        amount: 1,
                        currency: Currency.GBP,
                    }),
                    fees: expect.objectContaining({
                        amount: 1,
                        currency: Currency.EUR,
                    }),
                }),
            );
        });
    });
});
