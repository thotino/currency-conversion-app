import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Event as EventModel} from "./models/events.model";
import { WebhooksProviderDto } from "./dtos/webhooks.provider.dto";

@Injectable()
export class WebhooksRepository {
    constructor(
        @InjectModel(EventModel) readonly eventModel: typeof EventModel
    ) {}

    async save(event: WebhooksProviderDto) {
        await this.eventModel.create({
            id: event.eventId,
            provider_ref: event.providerRef,
            external_ref: event.data.externalReference,
            status: event.data.status,
            occured_at: event.occurredAt,
            payload: event.data,
        }, { ignoreDuplicates: true })
    }
}