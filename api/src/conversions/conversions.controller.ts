import {
    Body,
    Controller,
    Get,
    Headers,
    Query,
    Post,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from "@nestjs/common";
import { CreateConversionDto } from "./dtos/create-conversion.dto";
import { ConversionsService } from "./conversions.service";
import { QuoteNotFoundError } from "src/errors/QuoteNotFoundError";
import { AlreadyConsumedQuoteError } from "src/errors/AlreadyConsumedQuoteError";
import { ExpiredQuoteError } from "src/errors/ExpiredQuoteError";
import { IdempotencyKeyViolationError } from "src/errors/IdempotencyKeyViolationError";
@Controller("conversions")
export class ConversionsController {
    constructor(readonly conversionsService: ConversionsService) {}

    @Post()
    async create(
        @Body() body: CreateConversionDto,
        @Headers("X-Idempotency-Key") idempotencyKey: string,
    ) {
        try {
            if (idempotencyKey == null) {
                throw new BadRequestException(
                    "X-Idempotency-Key header is required",
                );
            }
            const conversion = await this.conversionsService.create(
                body.userId,
                body.quoteId,
                idempotencyKey,
            );
            return conversion;
        } catch (error) {
            if (error instanceof IdempotencyKeyViolationError) {
                throw new ConflictException(error.code, { cause: error });
            }
            if (error instanceof QuoteNotFoundError) {
                throw new NotFoundException(error.code, { cause: error });
            }
            if (error instanceof ExpiredQuoteError) {
                throw new BadRequestException(error.code, { cause: error });
            }
            if (error instanceof AlreadyConsumedQuoteError) {
                throw new ConflictException(error.code, { cause: error });
            }
            throw error;
        }
    }

    @Get()
    async list(@Query("userId") userId: string) {
        const conversions = await this.conversionsService.findAll(userId);
        return conversions;
    }
}
