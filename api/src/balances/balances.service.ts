import { Injectable } from "@nestjs/common";
import { Currency } from "src/constants";
import { ConversionsService } from "src/conversions/conversions.service";
import Balance from "src/entities/Balance";
import Conversion from "src/entities/Conversion";
import Money from "src/entities/Money";
import { USER_ID } from "src/constants";
const INITIAL_BALANCE = new Balance(USER_ID, new Map<Currency, Money>([
    [Currency.EUR, Money.from(1000, Currency.EUR)],
    [Currency.GBP, Money.from(1000, Currency.GBP)],
    [Currency.USD, Money.from(1000, Currency.USD)],
]))

@Injectable()
export class BalancesService {
    constructor(readonly conversionsService: ConversionsService) {}
    private static reducer(balance: Balance, conversion: Conversion | null): Balance {
        if (conversion !== null && conversion.isCompleted()) {
            return balance.applyConversion(conversion)
        }
        return balance;
    }

    async buildBalanceOnDemand(userId: string) {
        const conversions = await this.conversionsService.findAll(userId);
        const currentBalance = conversions.reduce((balance, conversion) => {return BalancesService.reducer(balance, conversion)}, INITIAL_BALANCE)
        return currentBalance;
    }

}