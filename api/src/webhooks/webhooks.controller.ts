import { Body, Controller, Post } from '@nestjs/common';
import { WebhooksProviderDto } from './dtos/webhooks.provider.dto';

@Controller('webhooks')
export class WebhooksController {
  @Post('provider')
  receive(@Body() webhookEventData: WebhooksProviderDto) {
    
  }
}
