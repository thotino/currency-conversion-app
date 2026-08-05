import { Type } from "class-transformer";
import { IsDate, IsDateString, IsEnum, IsNumber, IsPositive, IsString, ValidateNested } from "class-validator";
import { Currency } from "src/constants";
import Money from "src/entities/Money";
import Quote from "src/entities/Quote";

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
  declare source : MoneyDto;

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
      //! Beware! By building a new Quote here, you are not using the original expiration date.
      quote: new Quote(
        Money.from(this.source.amount, this.source.currency),
        Money.from(this.target.amount, this.target.currency),
        this.rate,
        Money.from(this.fees.amount, this.fees.currency),
      ),
    };
  }
}
