import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Event as EventModel } from "./models/events.model";
import { WebhooksProviderDto } from "./dtos/webhooks.provider.dto";
import { Conversion as ConversionModel } from "src/conversions/models/conversions.model";
import { Sequelize } from "sequelize-typescript";
import Conversion from "src/entities/Conversion";
import {
    ConversionStatus,
    WebhookEventProcessingStatus,
    WebhookEventDataStatus,
} from "src/constants";
import { literal, Op } from "sequelize";
import { WebhookEvent, WebhookEventPayload } from "src/types";

const PROCESSING_BATCH_SIZE = 100;
const EVENT_CONVERSION_STATUS_MAPPING = new Map([
    [WebhookEventDataStatus.ACCEPTED, ConversionStatus.ACCEPTED],
    [WebhookEventDataStatus.REJECTED, ConversionStatus.REJECTED],
    [WebhookEventDataStatus.EXECUTED, ConversionStatus.COMPLETED],
]);

@Injectable()
export class WebhooksRepository {
    constructor(
        private sequelize: Sequelize,
        @InjectModel(EventModel) readonly eventModel: typeof EventModel,
        @InjectModel(ConversionModel)
        readonly conversionModel: typeof ConversionModel,
    ) {}
    private static format(instance: EventModel) {
        if (instance.event_payload.status === WebhookEventDataStatus.ACCEPTED) {
        }
        if (instance.event_payload.status === WebhookEventDataStatus.ACCEPTED) {
        }
        if (instance.event_payload.status === WebhookEventDataStatus.ACCEPTED) {
        }
        return {
            id: instance.id,
            eventId: instance.event_id,
            type: instance.event_type,
            providerRef: instance.provider_ref,
            occuredAt: instance.event_occurred_at,
            payload: instance.event_payload as WebhookEventPayload,
            status: instance.event_processing_status,
        } as WebhookEvent;
    }
    async save(event: WebhooksProviderDto) {
        return await this.eventModel.findOrCreate(
            {
                where: { event_id: event.eventId },
                defaults: {
                    id: crypto.randomUUID(),
                    event_id: event.eventId,
                    event_type: event.eventType,
                    provider_ref: event.providerRef,
                    event_processing_status:
                        WebhookEventProcessingStatus.PENDING,
                    event_occurred_at: event.occurredAt,
                    event_payload: event.data,
                },
            },
            // { ignoreDuplicates: true, returning: ["id"] },
        );
    }

    async findAllPendingEvents() {
        const transaction = await this.sequelize.transaction();
        try {
            const events = await this.eventModel.findAll({
                where: {
                    event_processing_status:
                        WebhookEventProcessingStatus.PENDING,
                },
                attributes: [
                    "id",
                    "event_id",
                    "event_type",
                    "provider_ref",
                    "event_occurred_at",
                    "event_payload",
                ],
                order: [["event_occurred_at", "ASC"]],
                lock: transaction.LOCK.UPDATE,
                skipLocked: true,
                limit: PROCESSING_BATCH_SIZE,
                transaction,
            });
            if (events.length === 0) {
                await transaction.commit();
                return null;
            }
            const eventIds = events.map(event => event.id);
            const [updatedInstancesNb] = await this.eventModel.update(
                {
                    event_processing_status:
                        WebhookEventProcessingStatus.PROCESSING,
                },
                {
                    where: {
                        id: { [Op.in]: eventIds },
                        event_processing_status:
                            WebhookEventProcessingStatus.PENDING,
                    },
                    transaction,
                },
            );
            if (updatedInstancesNb != events.length) {
                throw new Error("ERR_UPDATE_LOCKED_INSTANCE");
            }
            await transaction.commit();
            return events.map(WebhooksRepository.format);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    async updateConversions(processingEvents: WebhookEvent[]) {
        const transaction = await this.sequelize.transaction();
        try {
            // const eventIds = new Set(processingEvents.map(event => event.id));
            // 1. Build an event mapping
            const eventMapping = new Map(
                // What if there are several events for the same convrsion order??
                processingEvents.map(event => [
                    `${event.payload.externalReference}::${event.payload.providerRef}`,
                    event,
                ]),
            );
            const eventTuples = new Set(
                processingEvents.map(
                    event =>
                        `(${this.sequelize.escape(event.payload.externalReference)}, ${this.sequelize.escape(event.payload.providerRef)})`,
                ),
            );
            const eventTuplesAsLitteral = Array.from(eventTuples).join(",");
            // 2. Retrieve the conversions
            const conversions = await this.conversionModel.findAll({
                where: {
                    [Op.and]: [
                        literal(
                            `(id, provider_ref) IN (${eventTuplesAsLitteral})`,
                        ),
                        {
                            status: {
                                [Op.in]: [
                                    ConversionStatus.SUBMITTING,
                                    ConversionStatus.SUBMITTED,
                                    ConversionStatus.UNKNOWN,
                                    ConversionStatus.PENDING,
                                    ConversionStatus.COMPLETED,
                                    ConversionStatus.REJECTED,
                                ],
                            },
                        },
                    ],
                },
                lock: transaction.LOCK.UPDATE,
                transaction,
            });
            if (conversions.length == 0) {
                throw new Error("ERR_CONVERSIONS_RETRIEVAL_FAILED");
            }
            // 3. Build a conversions mapping
            const conversionMapping = new Map(
                conversions.map(conversion => [
                    `${conversion.id}::${conversion.provider_ref}`,
                    conversion,
                ]),
            );
            // 4. Build the updates
            const eventUpdates = [];
            const conversionUpdates = [];
            for (let event of processingEvents) {
                const key = `${event.payload.externalReference}::${event.payload.providerRef}`;
                const eventUpdt = {
                    ...event,
                    id: event.id,
                    event_id: event.eventId,
                    event_type: event.type,
                    event_processing_status: event.status,
                    provider_ref: event.providerRef,
                    event_occurred_at: event.occuredAt,
                    event_payload: event.payload,
                };
                if (event.eventId != eventMapping.get(key)?.eventId) {
                    eventUpdt.event_processing_status =
                        WebhookEventProcessingStatus.IGNORED;
                    eventUpdates.push(eventUpdt);
                    continue;
                }
                const conversion = conversionMapping.get(key);
                if (conversion == null) {
                    //! This can happen in the case of early webhook (we received the event before the confirmation of the submission).
                    eventUpdt.event_processing_status =
                        WebhookEventProcessingStatus.FAILED_NEED_MANUAL_REVIEW;
                    eventUpdates.push(eventUpdt);
                    continue;
                }
                const conversionUpdt = {
                    ...conversion.toJSON(),
                    id: conversion.id,
                    status: conversion.status,
                };
                if (event.payload.status === WebhookEventDataStatus.ACCEPTED) {
                    if (
                        new Set([
                            ConversionStatus.UNKNOWN,
                            ConversionStatus.SUBMITTED,
                        ]).has(conversionUpdt.status)
                    ) {
                        conversionUpdt.status = ConversionStatus.ACCEPTED;
                        eventUpdt.event_processing_status =
                            WebhookEventProcessingStatus.COMPLETED;
                    } else {
                        eventUpdt.event_processing_status =
                            WebhookEventProcessingStatus.IGNORED;
                    }
                }
                if (event.payload.status === WebhookEventDataStatus.EXECUTED) {
                    if (
                        new Set([
                            ConversionStatus.UNKNOWN,
                            ConversionStatus.SUBMITTED,
                            ConversionStatus.ACCEPTED,
                            ConversionStatus.PENDING,
                        ]).has(conversionUpdt.status)
                    ) {
                        conversionUpdt.status = ConversionStatus.COMPLETED;
                        eventUpdt.event_processing_status =
                            WebhookEventProcessingStatus.COMPLETED;
                    } else {
                        eventUpdt.event_processing_status =
                            WebhookEventProcessingStatus.IGNORED;
                    }
                }
                if (event.payload.status === WebhookEventDataStatus.REJECTED) {
                    if (
                        new Set([
                            ConversionStatus.SUBMITTING,
                            ConversionStatus.UNKNOWN,
                            ConversionStatus.SUBMITTED,
                            ConversionStatus.ACCEPTED,
                            ConversionStatus.PENDING,
                        ]).has(conversionUpdt.status)
                    ) {
                        conversionUpdt.status = ConversionStatus.REJECTED;
                        eventUpdt.event_processing_status =
                            WebhookEventProcessingStatus.COMPLETED;
                    } else {
                        eventUpdt.event_processing_status =
                            WebhookEventProcessingStatus.IGNORED;
                    }
                }
                eventUpdates.push(eventUpdt);
                conversionUpdates.push(conversionUpdt);
            }
            await this.conversionModel.bulkCreate(conversionUpdates, {
                updateOnDuplicate: ["status", "updated_at"],
                transaction,
            });
            await this.eventModel.bulkCreate(eventUpdates, {
                updateOnDuplicate: ["event_processing_status", "updated_at"],
                transaction,
            });
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    // async updateConversionAsAccepted(event: Event, conversion: Conversion) {
    //     const transaction = await this.sequelize.transaction();
    //     try {
    //         await this.eventModel.update(
    //             { status: EventProcessingStatus.COMPLETED },
    //             { transaction, where: { id: event.id } },
    //         );
    //         await this.conversionModel.update(
    //             { status: ConversionStatus.ACCEPTED },
    //             { transaction, where: { id: conversion.id } },
    //         );
    //         await transaction.commit();
    //     } catch (error) {
    //         await transaction.rollback();
    //         throw error;
    //     }
    // }
    // async updateConversionAsCompleted(event: Event, conversion: Conversion) {
    //     const transaction = await this.sequelize.transaction();
    //     try {
    //         await this.eventModel.update(
    //             { status: EventProcessingStatus.COMPLETED },
    //             { transaction, where: { id: event.id } },
    //         );
    //         await this.conversionModel.update(
    //             { status: ConversionStatus.COMPLETED },
    //             { transaction, where: { id: conversion.id } },
    //         );
    //         await transaction.commit();
    //     } catch (error) {
    //         await transaction.rollback();
    //         throw error;
    //     }
    // }

    // async updateConversionAsRejected(event: Event, conversion: Conversion) {
    //     const transaction = await this.sequelize.transaction();
    //     try {
    //         await this.eventModel.update(
    //             { status: EventProcessingStatus.COMPLETED },
    //             { transaction, where: { id: event.id } },
    //         );
    //         await this.conversionModel.update(
    //             { status: ConversionStatus.FAILED },
    //             { transaction, where: { id: conversion.id } },
    //         );
    //         await transaction.commit();
    //     } catch (error) {
    //         await transaction.rollback();
    //         throw error;
    //     }
    // }
}
