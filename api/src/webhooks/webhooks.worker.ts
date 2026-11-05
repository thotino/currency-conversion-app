import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { WebhooksService } from "./webhooks.service";

@Injectable()
export class WebhooksWorker {
    constructor(private readonly webhooksService: WebhooksService) {}
    @Cron(CronExpression.EVERY_MINUTE, { waitForCompletion: true })
    async run() {
        // Find all pending events
        const events =
            await this.webhooksService.findPendingEventsToBeProcessed();
        if (Array.isArray(events)) {
            await this.webhooksService.updateConversionsFromEvents(events);
        }
    }
}
