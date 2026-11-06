import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { BalancesService } from "../balances.service";
import { BalancesController } from "../balances.controller";
import { vi } from "vitest";

describe("Balances", () => {
    let app: INestApplication;
    const balancesService = { buildBalanceOnDemand: vi.fn() };

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [BalancesController],
            providers: [
                {
                    provide: BalancesService,
                    useValue: balancesService,
                },
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });

    test("GET /balances", async () => {
        balancesService.buildBalanceOnDemand.mockResolvedValueOnce({
            userId: "user-1",
        });
        return request(app.getHttpServer()).get("/balances").expect(200);
    });
});
