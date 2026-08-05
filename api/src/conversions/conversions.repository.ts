import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Conversion as ConversionModel } from "./models/conversions.model";
import Quote from "src/entities/Quote";

@Injectable()
export class ConversionsRepository {
    constructor(@InjectModel(ConversionModel) readonly conversionModel: typeof ConversionModel) {}
    async create(idempotencyKey: string, userId: string, quote: Quote, providerRef: string, status: string) {
        const createdConversion = await this.conversionModel.create({
            id: idempotencyKey,
            user_id: userId,
            provider_ref: providerRef,
            quote: quote,
            status: status,
        })
        return createdConversion;
    }
    async findAll(userId: string) {
        return await this.conversionModel.findAll({ where: {user_id: userId} })
    }
}