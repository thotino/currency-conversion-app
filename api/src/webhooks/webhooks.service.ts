import { ConversionsService } from "src/conversions/conversions.service";
import { WebhooksProviderDto } from "./dtos/webhooks.provider.dto";
class ConversionNotFoundError extends Error{
    code: string = "CONVERSION_NOT_FOUND";
    value: {providerRef: string, externalRef: string};
    constructor(providerRef: string, externalRef: string) {
        const message= "Conversion instance not found";
        super(message)
        this.value = {providerRef, externalRef}
    }
}
enum ConversionsEventsTypes {
    EXECUTED = "conversion.executed",
    ACCEPTED = "conversion.accepted",
    REJECTED = "conversion.rejected"
}
export class WebhooksService {
    constructor(private conversionsService: ConversionsService) {}
    async handleEvent(event: WebhooksProviderDto) {
        const { eventType, data : { providerRef, externalReference } } = event;
        const conversion = await this.conversionsService.findOne(externalReference, providerRef);
        if (conversion == null) {throw new ConversionNotFoundError(providerRef, externalReference)}
        switch (eventType) {
            case ConversionsEventsTypes.EXECUTED:
                conversion.markAsCompleted();                
                break;

            case ConversionsEventsTypes.REJECTED:
                conversion.markAsFailed();
                break;
                
            case ConversionsEventsTypes.ACCEPTED:
                break;
            default:
                break;
        }
        return null
    }
}