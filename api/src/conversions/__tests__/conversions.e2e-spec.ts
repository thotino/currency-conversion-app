import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { ConversionsController } from "../conversions.controller";
import { ConversionsService } from "../conversions.service";
import { QuoteNotFoundError } from "src/errors/QuoteNotFoundError";

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
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });

    describe("Create a new conversion", () => {
        const quoteId = "QUOTE-ID"
        const userId = "USER-ID"
        test("should return a 400 response if quote id is not provided", async () => {
            const response  = await request(app.getHttpServer()).post("/conversions").send({ userId: userId,  });
            expect(response.status).toEqual(400);
            expect(response.body.message).toEqual("QUOTE_NOT_FOUND_ERROR")
        });
        test("should return a 404 response if no quote is found", async () => {
            conversionsService.create.mockRejectedValueOnce(new QuoteNotFoundError(quoteId));
            const response  = await request(app.getHttpServer()).post("/conversions").send({ userId: userId,  });
            expect(response.status).toEqual(404);
            expect(response.body.message).toEqual("QUOTE_NOT_FOUND_ERROR")
        });
    });
});
