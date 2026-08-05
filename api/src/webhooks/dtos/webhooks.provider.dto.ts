import { Currency } from "src/constants";

class WebhooksProviderDataDto {
    providerRef!: string;
    externalReference!: string;
    status?: string;
    sourceCurrency?: Currency;
    targetCurrency?: Currency;
    sourceAmount?: number;
    rate?: number;
    targetAmount?: number;
    reasonCode?: string;
}
export class WebhooksProviderDto {
    eventId!: string;
    eventType!: string;
    providerRef!: string;
    occuredAt!: string;
    data!: WebhooksProviderDataDto;
}