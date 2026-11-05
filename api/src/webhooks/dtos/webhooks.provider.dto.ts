import { Type } from "class-transformer";
import {
    IsDateString,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from "class-validator";
import { Currency, WebhookEventDataStatus } from "src/constants";

class WebhooksProviderDataDto {
    @IsString()
    providerRef!: string;

    @IsString()
    externalReference!: string;

    @IsEnum(WebhookEventDataStatus)
    status?: WebhookEventDataStatus;

    @IsEnum(Currency)
    sourceCurrency?: Currency;

    @IsEnum(Currency)
    targetCurrency?: Currency;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    sourceAmount?: number;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    rate?: number;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    targetAmount?: number;

    @IsString()
    @IsOptional()
    reasonCode?: string;
}
export class WebhooksProviderDto {
    @IsString()
    eventId!: string;

    @IsString()
    eventType!: string;

    @IsString()
    providerRef!: string;

    @IsDateString()
    occurredAt!: string;

    @ValidateNested()
    @Type(() => WebhooksProviderDataDto)
    data!: WebhooksProviderDataDto;
}
