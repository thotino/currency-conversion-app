import { Currency, ConversionStatus } from "./constants";
export interface MoneyInterface {
    amount: number;
    currency: Currency;
}
export interface QuoteInterface {
    source: MoneyInterface;
    target: MoneyInterface;
    fees: MoneyInterface;
    rate: number;
    expiration: Date;
}
type SubmissionResult =
    | { kind: ConversionStatus.SUBMITTED; id: string; providerRef: string }
    | { kind: ConversionStatus.REJECTED; id: string; reason: string }
    | { kind: ConversionStatus.UNKNOWN; id: string; reason: string };

export interface WebhookEvent {
    id: string;
    eventId: string;
    type: string;
    providerRef: string;
    occuredAt: Date;
    payload: Record<string, string>;
}
