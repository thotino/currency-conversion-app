import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { ConversionsController } from "../conversions.controller";
import { ConversionsService } from "../conversions.service";

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

    test("POST /conversions", async () => {
        conversionsService
            .create()
            .mockRejectedValueOnce(new QuoteNotFoundError());
        return request(app.getHttpServer()).post("/conversions").expect(404);
    });
});
