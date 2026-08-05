import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";
import { Currency } from "src/constants";

class MoneyDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsEnum(Currency)
  currency!: Currency;
}

export class CreateConversionDto {
  @ValidateNested()
  @Type(() => MoneyDto)
  declare source: MoneyDto;

  @ValidateNested()
  @Type(() => MoneyDto)
  declare target: MoneyDto;

  @ValidateNested()
  @Type(() => MoneyDto)
  declare fees: MoneyDto;

  @IsString()
  declare userId: string;

  @IsDateString()
  declare expiration: string;

  @IsNumber()
  @IsPositive()
  declare rate: number;

  toEntity() {
    return {
      userId: this.userId,
      quote: {
        source: { amount: this.source.amount, currency: this.source.currency },
        target: { amount: this.target.amount, currency: this.target.currency },
        fees: { amount: this.fees.amount, currency: this.fees.currency },
        rate: this.rate,
        expiration: new Date(this.expiration),
      },
    };
  }
}
