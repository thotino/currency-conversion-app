import { Body, Controller, Post } from '@nestjs/common';
import { WebhooksProviderDto } from './dtos/webhooks.provider.dto';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(readonly webhooksService: WebhooksService) {}
  @Post('provider')
  async receive(@Body() webhookEventData: WebhooksProviderDto) {
    await this.webhooksService.handleEvent(webhookEventData) 
  }
}
