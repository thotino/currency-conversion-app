import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Conversion as ConversionModel } from "./models/conversions.model";
import Conversion from "src/entities/Conversion";
import Quote from "src/entities/Quote";
import { ConversionStatus } from "src/constants";
import { Sequelize } from "sequelize-typescript";
import { Quote as QuoteModel } from "src/quotes/models/quotes.model";

@Injectable()
export class ConversionsRepository {
    constructor(
        private sequelize: Sequelize,
        @InjectModel(ConversionModel)
        readonly conversionModel: typeof ConversionModel,
        @InjectModel(QuoteModel) readonly quoteModel: typeof QuoteModel,
    ) {}

    private static formatQuote(quoteInstance: QuoteModel | null) {
        if (quoteInstance == null) return null;
        return Quote.from(
            quoteInstance.id,
            quoteInstance.source,
            quoteInstance.target,
            quoteInstance.fees,
            quoteInstance.rate,
            new Date(quoteInstance.expires_at),
            quoteInstance.consumed,
        );
    }
    private static format(instance: ConversionModel | null) {
        if (instance == null) return null;
        const quote = ConversionsRepository.formatQuote(instance.quote)!;
        return new Conversion(
            instance.user_id,
            instance.id,
            quote,
            instance.status as ConversionStatus,
        );
    }
    async createConversionReservation(
        quoteId: string,
        idempotencyKey: string,
        userId: string,
    ) {
        const transaction = await this.sequelize.transaction();
        try {
            const quote = await this.quoteModel.findByPk(quoteId, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (quote == null) {
                await transaction.commit();
                return {
                    quote: null,
                    conversion: null,
                    created: false,
                };
            }
            const [conversion, created] =
                await this.conversionModel.findOrCreate({
                    transaction,
                    where: { idempotency_key: idempotencyKey },
                    defaults: {
                        id: crypto.randomUUID(),
                        idempotency_key: idempotencyKey,
                        user_id: userId,
                        provider_ref: "",
                        quote_id: quoteId,
                        status: ConversionStatus.CREATED,
                    },
                });

            await quote.update({ consumed: true }, { transaction });

            await transaction.commit();
            return {
                quote: ConversionsRepository.formatQuote(quote),
                conversion: ConversionsRepository.format({...conversion, quote} as ConversionModel), 
                created
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    async updateWithProviderRefAndStatus(
        idempotencyKey: string,
        providerRef: string,
        status: ConversionStatus = ConversionStatus.SUBMITTED,
    ) {
        const transaction = await this.sequelize.transaction();

        try {
            const conversion = await this.conversionModel.findByPk(
                idempotencyKey,
                {
                    transaction,
                },
            );

            if (conversion == null) {
                return null;
            }

            await conversion.update(
                { provider_ref: providerRef, status },
                { transaction },
            );

            await transaction.commit();
            return this.findByKey(idempotencyKey);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    async markFailed(idempotencyKey: string) {
        const transaction = await this.sequelize.transaction();

        try {
            const conversion = await this.conversionModel.findByPk(
                idempotencyKey,
                {
                    transaction,
                },
            );

            if (conversion == null) {
                return null;
            }

            await conversion.update(
                { status: ConversionStatus.FAILED },
                { transaction },
            );
            await transaction.commit();

            return this.findByKey(idempotencyKey);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    async findAll(userId: string) {
        const retrievedInstances = await this.conversionModel.findAll({
            where: { user_id: userId },
            include: [{ model: QuoteModel, as: "quote" }],
        });
        return retrievedInstances.map(ConversionsRepository.format);
    }
    async findByKey(idempotencyKey: string) {
        const retrievedInstance = await this.conversionModel.findByPk(
            idempotencyKey,
            { include: [{ model: QuoteModel, as: "quote" }] },
        );
        return ConversionsRepository.format(retrievedInstance);
    }
    async *findCreated() {
        const conversions = await this.conversionModel.findAll({
            where: { status: ConversionStatus.CREATED },
            include: [{ model: QuoteModel, as: "quote" }],
        });
        if (conversions.length === 0) return null;
        for (const conversion of conversions) {
            yield ConversionsRepository.format(conversion);
        }
    }
}
