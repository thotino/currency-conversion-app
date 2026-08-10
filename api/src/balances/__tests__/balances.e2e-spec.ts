import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppConfigService } from "../../config/app-config.service";
import { BalancesModule } from "../balances.module";
import { BalancesService } from "../balances.service";

describe("Balances", () => {
  let app: INestApplication;
  const balancesService = { buildBalanceOnDemand: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [BalancesModule],
    })
      .overrideProvider(BalancesService)
      .useValue(balancesService)
      .overrideProvider(AppConfigService)
      .useValue({
        port: 3000,
        databaseUrl: "postgres://postgres:postgres@localhost:5432/postgres",
        providerBaseUrl: "http://provider:3001",
      })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  test("GET /balances", async () => {
    balancesService.buildBalanceOnDemand.mockResolvedValue({
      userId: "user-1",
    });
    return request(app.getHttpServer()).get("/balances").expect(200);
  });
});
