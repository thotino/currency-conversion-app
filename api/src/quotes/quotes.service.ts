import { Injectable } from "@nestjs/common";
import { Currency } from "src/constants";
import Money from "src/entities/Money";
import Quote from "src/entities/Quote";
import { ProviderClient } from "src/provider/provider.client";

@Injectable()
export class QuotesService {
    constructor(readonly providerClient: ProviderClient) {
    }
    async create(amount: number, sourceCurrency: Currency, targetCurrency: Currency) {
        const { rates } = await this.providerClient.getCurrentRates();
        const curRate = rates[`${sourceCurrency}/${targetCurrency}`];
        const sourceMoney = Money.from(amount, sourceCurrency)
        const targetMoney = Money.from(amount * curRate, targetCurrency)
        const quote = new Quote(sourceMoney, targetMoney, curRate, Money.from(0, sourceCurrency))
        return quote;
    }
}