import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Conversion as ConversionModel } from "./models/conversions.model";
import Conversion from "src/entities/Conversion";
import Quote from "src/entities/Quote";
import { ConversionStatus } from "src/types";
import { Sequelize } from "sequelize-typescript";
import { Quote as QuoteModel } from "src/quotes/models/quotes.model";

@Injectable()
export class ConversionsRepository {
    constructor(
        private sequelize: Sequelize, 
        @InjectModel(ConversionModel) readonly conversionModel: typeof ConversionModel,
        @InjectModel(QuoteModel) readonly quoteModel: typeof QuoteModel
    ) {}
    private static format(instance: ConversionModel | null) {
        if (instance == null) return null;
        const quote = Quote.from(instance.quote.id, instance.quote.source, instance.quote.target, instance.quote.fees, instance.quote.rate, new Date(instance.quote.expires_at))
        return new Conversion(instance.user_id, instance.id, quote, instance.status as ConversionStatus)
    }
    async create(idempotencyKey: string, userId: string, quoteId: string, providerRef: string, status: string) {
        const transaction = await this.sequelize.transaction()
        try {
            const quote = (await this.quoteModel.findByPk(quoteId))!;
            await quote.update({ consumed: true }, { transaction })
            const createdConversion = await this.conversionModel.create({
                id: idempotencyKey,
                user_id: userId,
                provider_ref: providerRef,
                quote_id: quoteId,
                status: status,
            }, { transaction, include: [{ model: QuoteModel, as: "quote" }] });
            
            await transaction.commit()
            return ConversionsRepository.format({...createdConversion, quote} as ConversionModel);
        } catch (error) {
            await transaction.rollback()
            throw error;
        }
    }
    async findAll(userId: string) {
        const retrievedInstances =  await this.conversionModel.findAll({ where: {user_id: userId}, include: [{model: QuoteModel, as: "quote" }] })
        return retrievedInstances.map(ConversionsRepository.format)
    }
    async findByKey(idempotencyKey: string) {
        const retrievedInstance = await this.conversionModel.findByPk(idempotencyKey, {include: [{model: QuoteModel, as: "quote" }]})
        return ConversionsRepository.format(retrievedInstance)
    }
    async findByKeyAndRef(idempotencyKey: string, providerRef: string) {
        const retrievedInstance = await this.conversionModel.findOne({ where: { id: idempotencyKey, provider_ref: providerRef }, include: [{model: QuoteModel, as: "quote"}]})
        return ConversionsRepository.format(retrievedInstance)
    }
    async update(conversion: Conversion) {
        const {id, status} = conversion.toJSON();
        const [updatedCount] = await this.conversionModel.update({ status }, { where: {id} })
        if (updatedCount === 0) return null;
        return this.findByKey(id)
    }
}