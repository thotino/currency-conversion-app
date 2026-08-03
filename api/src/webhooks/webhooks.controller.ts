import { Controller, NotImplementedException, Post } from '@nestjs/common';

@Controller('webhooks')
export class WebhooksController {
  @Post('provider')
  receive(): never {
    // TODO: handle events sent by the banking partner.
    throw new NotImplementedException();
  }
}
