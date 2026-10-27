import {
    Currency,
    ConversionStatus,
    WebhookEventDataStatus,
    WebhookEventProcessingStatus,
} from "./constants";
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

interface WebhookEventPayloadBase {
    providerRef: string;
    externalReference: string;
}

interface WebhookConversionDetails {
    sourceCurrency: Currency;
    targetCurrency: Currency;
    sourceAmount: number;
}

export type WebhookEventPayload = WebhookEventPayloadBase &
    (
        | (WebhookConversionDetails & {
              status: WebhookEventDataStatus.ACCEPTED;
          })
        | (WebhookConversionDetails & {
              status: WebhookEventDataStatus.EXECUTED;
              rate: number;
              targetAmount: number;
          })
        | {
              status: WebhookEventDataStatus.REJECTED;
              reasonCode: string;
          }
    );

export interface WebhookEvent {
    id: string;
    eventId: string;
    type: string;
    providerRef: string;
    occuredAt: Date;
    status: WebhookEventProcessingStatus;
    payload: WebhookEventPayload
}
