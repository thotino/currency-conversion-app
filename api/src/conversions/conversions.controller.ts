import { Body, Controller, Get, Headers, NotImplementedException, Post } from '@nestjs/common';
import { CreateConversionDto } from './dtos/create-conversion.dto';
import { ConversionsService } from './conversions.service';
const USER_ID = "00000000-0000-0000-0000-000000000001";

@Controller('conversions')
export class ConversionsController {
  constructor(readonly conversionsService: ConversionsService) {}
  
  @Post()
  async create(@Body() body: CreateConversionDto, @Headers("X-Idempotency-Key") idempotencyKey: string) {
    const conversionCreationData = body.toEntity()
    conversionCreationData.userId = USER_ID;
    const conversion = await this.conversionsService.create(conversionCreationData.userId, conversionCreationData.quote, idempotencyKey)
    return conversion;
  }

  @Get()
  async list() {
    const userId = USER_ID;
    const conversions = await this.conversionsService.findAll(userId);
    return conversions;
  }
}
