import { Injectable } from "@nestjs/common";
import { AppConfigService } from "../config/app-config.service";
import { Currency } from "src/constants";
interface Rates {
    base: string;
    asOf: string;
    rates: Record<string, number>;
}
/**
 * HTTP client for the banking partner. Only the base URL is wired up.
 * See provider/API.md for the partner's endpoints and webhook contract.
 */
@Injectable()
export class ProviderClient {
    readonly baseUrl: string;

    constructor(config: AppConfigService) {
        this.baseUrl = config.providerBaseUrl;
    }

    async getCurrentRates() {
        const response = await fetch(`${this.baseUrl}/v1/rates`);
        if (!response.ok) {
            throw new Error("ERR_FAILED_FETCHING_RATES");
        }
        return response.json();
    }

    async createConversion(
        reference: string,
        amount: number,
        sourceCurrency: Currency,
        targetCurrency: Currency,
    ) {
        const response = await fetch(`${this.baseUrl}/v1/conversions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount,
                sourceCurrency,
                targetCurrency,
                externalReference: reference,
            }),
        });
        if (!response.ok) {
            throw new Error("ERR_FAILED_CREATING_CONVERSION");
        }
        return response.json();
    }
}
