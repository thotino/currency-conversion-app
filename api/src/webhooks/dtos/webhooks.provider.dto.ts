import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Currency } from "src/constants";

class WebhooksProviderDataDto {
    @IsString()
    providerRef!: string;

    @IsString()
    externalReference!: string;

    @IsString()
    status?: string;

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