import { Currency } from "src/constants";
import { IsNumber, IsEnum, IsPositive } from "class-validator";

export class CreateQuoteDto {
    @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
    @IsPositive()
    amount!: number;

    @IsEnum(Currency)
    sourceCurrency!: Currency;

    @IsEnum(Currency)
    targetCurrency!: Currency;
}
