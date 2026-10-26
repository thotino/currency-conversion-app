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
        // for await (const pendingEvent of this.webhooksService.findAllPendingEvents()) {
        //     const conversion = await this.conversionsService.findOneByKey(
        //         pendingEvent.payload.externalRef,
        //     );
        //     if (conversion != null) {
        //         switch (pendingEvent.payload.status) {
        //             case "accepted":
        //                 await this.webhooksService.updateConversionAsAccepted(
        //                     pendingEvent,
        //                     conversion,
        //                 );
        //                 break;
        //             case "executed":
        //                 await this.webhooksService.updateConversionAsCompleted(
        //                     pendingEvent,
        //                     conversion,
        //                 );
        //                 break;
        //             case "rejected":
        //                 await this.webhooksService.updateConversionAsRejected(
        //                     pendingEvent,
        //                     conversion,
        //                 );
        //                 break;
        //         }
        //     }
        // }
        // For each event, find conversion
        // if conversion exists, update conversion and event
        // if conversion do not exists, do nothing
    }
}
