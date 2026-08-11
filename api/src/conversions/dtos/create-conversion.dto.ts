import { IsNotEmpty, IsString } from "class-validator";

export class CreateConversionDto {
    @IsString()
    @IsNotEmpty()
    userId!: string;

    @IsString()
    @IsNotEmpty()
    quoteId!: string;
}
