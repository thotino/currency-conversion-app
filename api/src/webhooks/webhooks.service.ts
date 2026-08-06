import { ConversionsService } from "src/conversions/conversions.service";
import { WebhooksProviderDto } from "./dtos/webhooks.provider.dto";
import { Injectable } from "@nestjs/common";
import { ConversionNotFoundError } from "src/errors/ConversionNotFoundError";
enum ConversionsEventsTypes {
    EXECUTED = "conversion.executed",
    ACCEPTED = "conversion.accepted",
    REJECTED = "conversion.rejected"
}
@Injectable()
export class WebhooksService {
    constructor(private conversionsService: ConversionsService) {}
    async handleEvent(event: WebhooksProviderDto) {
        const { eventType, data : { providerRef, externalReference } } = event;
        const conversion = await this.conversionsService.findOne(externalReference, providerRef);
        if (conversion == null) {throw new ConversionNotFoundError(providerRef, externalReference)}
        switch (eventType) {
            case ConversionsEventsTypes.EXECUTED:
                conversion.markAsCompleted();
                await this.conversionsService.updateOne(conversion);
                break;

            case ConversionsEventsTypes.REJECTED:
                conversion.markAsFailed();
                await this.conversionsService.updateOne(conversion);
                break;
        }
        return null
    }
}