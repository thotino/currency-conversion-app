import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Event as EventModel } from "./models/events.model";
import { WebhooksProviderDto } from "./dtos/webhooks.provider.dto";
import { Conversion as ConversionModel } from "src/conversions/models/conversions.model";
import { Sequelize } from "sequelize-typescript";
import Conversion from "src/entities/Conversion";
import { ConversionStatus, EventProcessingStatus } from "src/constants";
import { literal, Op } from "sequelize";
interface Event {
    id: string;
    eventId: string;
    type: string;
    providerRef: string;
    occuredAt: Date;
    payload: Record<string, string>;
}
const PROCESSING_BATCH_SIZE = 100;
@Injectable()
export class WebhooksRepository {
    constructor(
        private sequelize: Sequelize,
        @InjectModel(EventModel) readonly eventModel: typeof EventModel,
        @InjectModel(ConversionModel)
        readonly conversionModel: typeof ConversionModel,
    ) {}
    private static format(instance: EventModel) {
        return {
            id: instance.id,
            eventId: instance.event_id,
            type: instance.event_type,
            providerRef: instance.provider_ref,
            occuredAt: instance.event_occurred_at,
            payload: instance.event_payload,
        } as Event;
    }
    async save(event: WebhooksProviderDto) {
        await this.eventModel.create(
            {
                id: crypto.randomUUID(),
                event_id: event.eventId,
                event_type: event.eventType,
                provider_ref: event.providerRef,
                event_processing_status: EventProcessingStatus.PENDING,
                event_occurred_at: event.occurredAt,
                event_payload: event.data,
            },
            { ignoreDuplicates: true },
        );
    }

    async findAllPendingEvents() {
        const transaction = await this.sequelize.transaction();
        try {
            const events = await this.eventModel.findAll({
                where: {
                    event_processing_status: EventProcessingStatus.PENDING,
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
                    event_processing_status: EventProcessingStatus.PROCESSING,
                },
                {
                    where: {
                        id: { [Op.in]: eventIds },
                        event_processing_status: EventProcessingStatus.PENDING,
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
    async updateConversions(processingEvents: Event[]) {
        const transaction = await this.sequelize.transaction();
        try {
            const conversionUpdates = [];
            const externalRefs = new Set(
                processingEvents.map(event => event.payload.externalReference),
            );
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
            const conversions = await this.conversionModel.findAll({
                where: literal(
                    `(id, provider_ref) IN (${eventTuplesAsLitteral})`,
                ),
                lock: transaction.LOCK.UPDATE,
            });
        } catch (error) {}
    }
    async updateConversionAsAccepted(event: Event, conversion: Conversion) {
        const transaction = await this.sequelize.transaction();
        try {
            await this.eventModel.update(
                { status: EventProcessingStatus.COMPLETED },
                { transaction, where: { id: event.id } },
            );
            await this.conversionModel.update(
                { status: ConversionStatus.ACCEPTED },
                { transaction, where: { id: conversion.id } },
            );
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    async updateConversionAsCompleted(event: Event, conversion: Conversion) {
        const transaction = await this.sequelize.transaction();
        try {
            await this.eventModel.update(
                { status: EventProcessingStatus.COMPLETED },
                { transaction, where: { id: event.id } },
            );
            await this.conversionModel.update(
                { status: ConversionStatus.COMPLETED },
                { transaction, where: { id: conversion.id } },
            );
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async updateConversionAsRejected(event: Event, conversion: Conversion) {
        const transaction = await this.sequelize.transaction();
        try {
            await this.eventModel.update(
                { status: EventProcessingStatus.COMPLETED },
                { transaction, where: { id: event.id } },
            );
            await this.conversionModel.update(
                { status: ConversionStatus.FAILED },
                { transaction, where: { id: conversion.id } },
            );
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}
