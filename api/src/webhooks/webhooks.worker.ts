import { Injectable } from "@nestjs/common";
import { WebhooksRepository } from "./webhooks.repository";
import { ConversionsService } from "src/conversions/conversions.service";

@Injectable()
export class WebhooksWorker {
    constructor(private readonly webhooksRepository: WebhooksRepository, private readonly conversionsService: ConversionsService) {}
    async run() {
        while (true) {

            // Find all pending events
            for await (const pendingEvent of this.webhooksRepository.findAllPendingEvents()) {
                const conversion = await this.conversionsService.findOne(pendingEvent.externalRef, pendingEvent.providerRef);
                if (conversion != null) {
                    switch(pendingEvent.payload.status) {
                        case "executed":
                            await this.webhooksRepository.updateConversionAsCompleted(pendingEvent,conversion)
                            break;
                        case "rejected":
                            await this.webhooksRepository.updateConversionAsRejected(pendingEvent, conversion)
                            break;
                    }
                }
            }
            // For each event, find conversion
            // if conversion exists, update conversion and event
            // if conversion do not exists, do nothing
        }
    }
}