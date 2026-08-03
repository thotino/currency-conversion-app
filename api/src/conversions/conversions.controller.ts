import { Controller, Get, NotImplementedException, Post } from '@nestjs/common';

@Controller('conversions')
export class ConversionsController {
  @Post()
  create(): never {
    // TODO: place a conversion order.
    throw new NotImplementedException();
  }

  @Get()
  list(): never {
    // TODO: list conversion orders.
    throw new NotImplementedException();
  }
}
