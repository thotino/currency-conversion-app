import { WebhooksProviderDto } from "./dtos/webhooks.provider.dto";
import { Injectable } from "@nestjs/common";
import { WebhooksRepository } from "./webhooks.repository";
import { WebhookEvent } from "src/types";
enum ConversionsEventsTypes {
    EXECUTED = "conversion.executed",
    ACCEPTED = "conversion.accepted",
    REJECTED = "conversion.rejected",
}
@Injectable()
export class WebhooksService {
    constructor(private webhooksRepository: WebhooksRepository) {}
    async handleEvent(event: WebhooksProviderDto) {
        await this.webhooksRepository.save(event);
    }
    async findPendingEventsToBeProcessed() {
        const events = await this.webhooksRepository.findAllPendingEvents();
        return Array.isArray(events) ? events : null;
    }
    async updateConversionsFromEvents(events: WebhookEvent[]) {
        return this.webhooksRepository.updateConversions(events)
    }
}
