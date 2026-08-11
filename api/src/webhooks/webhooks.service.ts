import { ConversionsService } from "src/conversions/conversions.service";
import { WebhooksProviderDto } from "./dtos/webhooks.provider.dto";
import { Injectable } from "@nestjs/common";
import { ConversionNotFoundError } from "src/errors/ConversionNotFoundError";
import { WebhooksRepository } from "./webhooks.repository";
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
}
