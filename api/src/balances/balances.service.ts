import { Injectable } from "@nestjs/common";
import { Currency } from "src/constants";
import { ConversionsService } from "src/conversions/conversions.service";
import Balance from "src/entities/Balance";
import Conversion from "src/entities/Conversion";
import Money from "src/entities/Money";
import { USER_ID } from "src/constants";
const INITIAL_BALANCE = new Balance(
  USER_ID,
  new Map<Currency, Money>([
    [Currency.EUR, Money.from(1000, Currency.EUR)],
    [Currency.GBP, Money.from(1000, Currency.GBP)],
    [Currency.USD, Money.from(1000, Currency.USD)],
  ]),
);

@Injectable()
export class BalancesService {
  constructor(
    private readonly conversionsService: ConversionsService,
  ) {}
  private static reducer(
    balance: Balance,
    conversion: Conversion | null,
  ): Balance {
    const resBalance = new Balance(balance.userId, balance.balanceByCurrency)
    if (conversion !== null && conversion.isCompleted()) {
      return resBalance.applyConversion(conversion);
    }
    return resBalance;
  }

    async buildBalanceOnDemand(userId: string) {
        const conversions = await this.conversionsService.findAll(userId);
        const currentBalance = conversions.reduce((balance, conversion) => {return BalancesService.reducer(balance, conversion)}, INITIAL_BALANCE)
        return currentBalance;
    }
}
