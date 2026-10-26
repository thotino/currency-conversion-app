import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Event as EventModel } from "./models/events.model";
import { WebhooksProviderDto } from "./dtos/webhooks.provider.dto";
import { Conversion as ConversionModel } from "src/conversions/models/conversions.model";
import { Sequelize } from "sequelize-typescript";
import Conversion from "src/entities/Conversion";
import { ConversionStatus, EventProcessingStatus } from "src/constants";
interface Event {
    id: string;
    type: string;
    providerRef: string;
    occuredAt: Date;
    payload: Record<string, string>;
}

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
            id: instance.event_id,
            type: instance.event_type,
            // externalRef: instance.external_ref,
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

    async *findAllPendingEvents() {
        const events = await this.eventModel.findAll({
            where: {
                event_processing_status: EventProcessingStatus.PENDING,
            },
            order: [["event_occurred_at", "ASC"]],
        });
        if (events.length === 0) return null;
        for (const event of events) {
            yield WebhooksRepository.format(event);
        }
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
