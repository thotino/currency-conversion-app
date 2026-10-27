import { Injectable } from "@nestjs/common";
import { WebhooksRepository } from "./webhooks.repository";
import { ConversionsService } from "src/conversions/conversions.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { WebhooksService } from "./webhooks.service";
enum webhookEventDataStatus {
    ACCEPTED = "accepted",
    EXECUTED = "executed",
    REJECTED = "rejected",
}
@Injectable()
export class WebhooksWorker {
    constructor(
        private readonly webhooksService: WebhooksService,
        private readonly conversionsService: ConversionsService,
    ) {}
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
