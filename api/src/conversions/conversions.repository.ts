import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Conversion as ConversionModel } from "./models/conversions.model";
import Quote from "src/entities/Quote";
import Conversion from "src/entities/Conversion";
import { ConversionStatus, MoneyInterface } from "src/types";

@Injectable()
export class ConversionsRepository {
    constructor(@InjectModel(ConversionModel) readonly conversionModel: typeof ConversionModel) {}
    private static format(instance: ConversionModel | null) {
        if (instance == null) return null;
        return new Conversion(instance.user_id, instance.id, Quote.from(
            instance.quote.source as MoneyInterface, 
            instance.quote.target as MoneyInterface, 
            instance.quote.fees as MoneyInterface, 
            instance.quote.rate as number, 
            new Date(instance.quote.expiration as string)), instance.status as ConversionStatus)
    }
    async create(idempotencyKey: string, userId: string, quote: Quote, providerRef: string, status: string) {
        const createdConversion = await this.conversionModel.create({
            id: idempotencyKey,
            user_id: userId,
            provider_ref: providerRef,
            quote: quote,
            status: status,
        });
        return ConversionsRepository.format(createdConversion!);
    }
    async findAll(userId: string) {
        const retrievedInstances =  await this.conversionModel.findAll({ where: {user_id: userId} })
        return retrievedInstances.map(ConversionsRepository.format)
    }
    async findByKey(idempotencyKey: string) {
        const retrievedInstance = await this.conversionModel.findByPk(idempotencyKey)
        return ConversionsRepository.format(retrievedInstance)
    }
    async findByKeyAndRef(idempotencyKey: string, providerRef: string) {
        const retrievedInstance = await this.conversionModel.findOne({ where: { id: idempotencyKey, provider_ref: providerRef } })
        return ConversionsRepository.format(retrievedInstance)
    }
    async update(conversion: Conversion) {
        const {id, status} = conversion.toJSON();
        const [updatedCount] = await this.conversionModel.update({ status }, { where: {id} })
        if (updatedCount === 0) return null;
        return this.findByKey(id)
    }
}