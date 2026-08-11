import { IsString } from "class-validator";

export class CreateConversionDto {
    @IsString()
    declare userId: string;

    @IsString()
    declare quoteId: string;
}
