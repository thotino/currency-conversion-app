import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import Conversion from "src/entities/Conversion";
import Quote from "src/entities/Quote";
import { ProviderClient } from "src/provider/provider.client";
import { ConversionsRepository } from "./conversions.repository";

@Injectable()
export class ConversionsService {
    constructor(readonly providerClient: ProviderClient, readonly conversionRepository: ConversionsRepository) {}
    async create(userId: string, quote: Quote, idempotencyKey: string) {
        const { providerRef } = await this.providerClient.createConversion(idempotencyKey, quote.source.amount, quote.source.currency, quote.target.currency)
        const conversion = new Conversion(userId, idempotencyKey, quote);
        await this.conversionRepository.create(idempotencyKey, userId, quote, providerRef, "PENDING")
        return conversion;
    }
    async findAll(userId: string) {
        return await this.conversionRepository.findAll(userId)
    }
}