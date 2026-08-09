import { Injectable } from "@nestjs/common";
import { Currency } from "src/constants";
import Money from "src/entities/Money";
import { ProviderClient } from "src/provider/provider.client";
import { QuotesRepository } from "./quotes.repository";
import { addSeconds, parseISO } from "date-fns";

@Injectable()
export class QuotesService {
    constructor(readonly providerClient: ProviderClient, readonly quotesRepository: QuotesRepository) {
    }
    async create(amount: number, sourceCurrency: Currency, targetCurrency: Currency) {
        const { rates, asOf: ratesCreationDate } = await this.providerClient.getCurrentRates();
        const curRate = rates[`${sourceCurrency}/${targetCurrency}`];
        const sourceMoney = Money.from(amount, sourceCurrency)
        const targetMoney = Money.from(parseFloat((amount * curRate).toFixed(2)), targetCurrency)
        const feesMoney = Money.from(1, sourceCurrency);
        const quote = await this.quotesRepository.create(sourceMoney, targetMoney, feesMoney, curRate, addSeconds(parseISO(ratesCreationDate), 30))
        return quote;
    }
}