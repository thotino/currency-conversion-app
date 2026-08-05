import { Currency } from "./constants";
export interface MoneyInterface {
    amount: number;
    currency: Currency;
};
export interface QuoteInterface {
    source: MoneyInterface;
    target: MoneyInterface;
    fees: MoneyInterface;
    rate: number;
    expiration: Date;
};
export type ConversionStatus = "PENDING" | "COMPLETED" | "FAILED";
