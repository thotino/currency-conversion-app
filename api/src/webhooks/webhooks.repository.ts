import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Event as EventModel } from "./models/events.model";
import { WebhooksProviderDto } from "./dtos/webhooks.provider.dto";
import { Conversion as ConversionModel } from "src/conversions/models/conversions.model";
import { Sequelize } from "sequelize-typescript";
import Conversion from "src/entities/Conversion";

@Injectable()
export class WebhooksRepository {
  constructor(
    private sequelize: Sequelize,
    @InjectModel(EventModel) readonly eventModel: typeof EventModel,
    @InjectModel(ConversionModel)
    readonly conversionModel: typeof ConversionModel,
  ) {}
  private static format(instance: EventModel | null) {
    if (instance == null) return null;
    return {
        id: instance.id,
        externalRef: instance.external_ref,
        providerRef: instance.provider_ref,
        occuredAt: instance.occured_at,
        payload: instance.payload
    };
  }
  async save(event: WebhooksProviderDto) {
    await this.eventModel.create(
      {
        id: event.eventId,
        provider_ref: event.providerRef,
        external_ref: event.data.externalReference,
        status: "PENDING",
        occured_at: event.occurredAt,
        payload: event.data,
      },
      { ignoreDuplicates: true },
    );
  }

  async *findAllPendingEvents() {
    const events = await this.eventModel.findAll({
      where: {
        status: "PENDING",
      },
      order: [["occured_at", "ASC"]],
    });
    if (events.length === 0) return null;
    for (const event of events) {
      yield WebhooksRepository.format(event);
    }
  }
  async updateConversionAsCompleted(event: EventModel, conversion: Conversion) {
    const transaction = await this.sequelize.transaction();
    try {
      await this.eventModel.update(
        { status: "COMPLETED" },
        { transaction, where: { status: "PENDING", id: event.id } },
      );
      await this.conversionModel.update(
        { status: "COMPLETED" },
        { transaction, where: { status: "PENDING", id: conversion.id } },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateConversionAsRejected(event: EventModel, conversion: Conversion) {
    const transaction = await this.sequelize.transaction();
    try {
      await this.eventModel.update(
        { status: "COMPLETED" },
        { transaction, where: { status: "PENDING", id: event.id } },
      );
      await this.conversionModel.update(
        { status: "FAILED" },
        { transaction, where: { status: "PENDING", id: conversion.id } },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
