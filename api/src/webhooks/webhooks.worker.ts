import { Injectable } from "@nestjs/common";
import { WebhooksRepository } from "./webhooks.repository";
import { ConversionsService } from "src/conversions/conversions.service";
enum webhookEventDataStatus {
    ACCEPTED = "accepted",
    EXECUTED = "executed",
    REJECTED = "rejected",
}
@Injectable()
export class WebhooksWorker {
    timer: NodeJS.Timeout | null = null;
    constructor(
        private readonly webhooksRepository: WebhooksRepository,
        private readonly conversionsService: ConversionsService,
    ) {}
    async run() {
        this.timer = setInterval(async () => {
            // Find all pending events
            for await (const pendingEvent of this.webhooksRepository.findAllPendingEvents()) {
                const conversion = await this.conversionsService.findOneByKey(
                    pendingEvent.payload.externalRef,
                );
                if (conversion != null) {
                    switch (pendingEvent.payload.status) {
                        case "accepted":
                            await this.webhooksRepository.updateConversionAsAccepted(
                                pendingEvent,
                                conversion,
                            );
                            break;
                        case "executed":
                            await this.webhooksRepository.updateConversionAsCompleted(
                                pendingEvent,
                                conversion,
                            );
                            break;
                        case "rejected":
                            await this.webhooksRepository.updateConversionAsRejected(
                                pendingEvent,
                                conversion,
                            );
                            break;
                    }
                }
            }
            // For each event, find conversion
            // if conversion exists, update conversion and event
            // if conversion do not exists, do nothing
        }, 1000 * 10);
    }
    async stop() {
        if (this.timer != null) {
            clearInterval(this.timer);
        }
    }
}
