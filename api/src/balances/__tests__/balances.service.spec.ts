import { BalancesService } from "../balances.service";
import { ConversionsService } from "../../conversions/conversions.service";
import Conversion from "src/entities/Conversion";
import Quote from "src/entities/Quote";
import Money from "src/entities/Money";
import Balance from "src/entities/Balance";
import { ConversionStatus, Currency, USER_ID } from "src/constants";

jest.mock("../../conversions/conversions.service");

describe("Balances", () => {
    // @ts-expect-error
    const conversionsService: jest.Mocked<ConversionsService> = {
        findAll: jest.fn(),
    };
    let balancesService: BalancesService;
    beforeEach(() => {
        balancesService = new BalancesService(conversionsService);
    });
    test("should build a new balance", async () => {
        const quote = new Quote(
            "RANDOM_ID",
            Money.from(1, Currency.EUR),
            Money.from(1, Currency.GBP),
            1,
            Money.from(1, Currency.EUR),
        );
        conversionsService.findAll.mockResolvedValueOnce([
            new Conversion(
                USER_ID,
                "MY_KEY",
                quote,
                ConversionStatus.COMPLETED,
            ),
        ]);
        const computedBalance =
            await balancesService.buildBalanceOnDemand(USER_ID);
        expect(computedBalance).toBeInstanceOf(Balance);
        expect(computedBalance.toJSON()).toEqual({
            userId: USER_ID,
            balance: {
                EUR: 998,
                USD: 1000,
                GBP: 1001,
            },
        });
    });
});
