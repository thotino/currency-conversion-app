import { Body, Controller, Get, Headers, Query, Post } from '@nestjs/common';
import { CreateConversionDto } from './dtos/create-conversion.dto';
import { ConversionsService } from './conversions.service';
@Controller('conversions')
export class ConversionsController {
  constructor(readonly conversionsService: ConversionsService) {}
  
  @Post()
  async create(@Body() body: CreateConversionDto, @Headers("X-Idempotency-Key") idempotencyKey: string) {
    try {
      const conversion = await this.conversionsService.create(body.userId, body.quoteId, idempotencyKey)
      return conversion;
    } catch (error) {
      throw error;
    }
  }

  @Get()
  async list(@Query("userId") userId: string) {
    const conversions = await this.conversionsService.findAll(userId);
    return conversions;
  }
}
