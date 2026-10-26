import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Conversion as ConversionModel } from "./models/conversions.model";
import Conversion from "src/entities/Conversion";
import Quote from "src/entities/Quote";
import { ConversionStatus } from "src/constants";
import { Sequelize } from "sequelize-typescript";
import { Quote as QuoteModel } from "src/quotes/models/quotes.model";
import { Op } from "sequelize";
import { SubmissionResult } from "src/types";
const SUBMISSION_BATCH_SIZE = 10;
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
            instance.dataValues.id,
            instance.dataValues.user_id,
            instance.dataValues.idempotency_key,
            instance.dataValues.status as ConversionStatus,
            quote,
        );
    }
    async createConversion(
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
            const existingConversion = await this.conversionModel.findOne({
                where: {
                    idempotency_key: idempotencyKey,
                    quote_id: quoteId,
                    user_id: userId,
                },
                transaction,
            });
            if (existingConversion != null) {
                await transaction.commit();
                return {
                    quote: ConversionsRepository.formatQuote(quote),
                    conversion: ConversionsRepository.format({
                        ...existingConversion,
                        quote,
                    } as ConversionModel),
                    created: false,
                };
            }

            if (quote.consumed == true || quote.expires_at < new Date()) {
                await transaction.commit();
                return {
                    quote: ConversionsRepository.formatQuote(quote),
                    conversion: null,
                    created: false,
                };
            }
            const [conversion, created] =
                await this.conversionModel.findOrCreate({
                    transaction,
                    where: {
                        idempotency_key: idempotencyKey,
                        user_id: userId,
                        quote_id: quoteId,
                    },
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
                conversion: ConversionsRepository.format({
                    ...conversion,
                    quote,
                } as ConversionModel),
                created,
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    async updateAfterSubmissionAttempt(conversions: SubmissionResult[]) {
        const transaction = await this.sequelize.transaction();
        const conversionIds = conversions.map(conversion => conversion.id);
        try {
            const conversionInstances = await this.conversionModel.findAll({
                where: {
                    id: { [Op.in]: conversionIds },
                    status: { [Op.in]: [ConversionStatus.SUBMITTING] },
                },
                lock: transaction.LOCK.UPDATE,
                transaction,
            });
            const conversionsUpdates = conversionInstances.map(instance => {
                const curConversion = conversions.find(
                    conversion => conversion.id == instance.id,
                );
                if (curConversion != null) {
                    if (curConversion.kind === ConversionStatus.SUBMITTED) {
                        return {
                            ...instance.toJSON(),
                            status: curConversion.kind,
                            provider_ref: curConversion.providerRef,
                        };
                    }
                    return {
                        ...instance.toJSON(),
                        status: curConversion.kind,
                    };
                }
                return {
                    ...instance.toJSON(),
                };
            });
            await this.conversionModel.bulkCreate(conversionsUpdates, {
                updateOnDuplicate: ["status", "provider_ref", "updated_at"],
                transaction,
            });
            await transaction.commit();
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
        const retrievedInstance = await this.conversionModel.findOne({
            where: { idempotency_key: idempotencyKey },
            include: [{ model: QuoteModel, as: "quote" }],
        });
        return ConversionsRepository.format(retrievedInstance);
    }
    async findCreated() {
        const transaction = await this.sequelize.transaction();
        try {
            const conversions = await this.conversionModel.findAll({
                where: { status: ConversionStatus.CREATED },
                limit: SUBMISSION_BATCH_SIZE,
                include: [{ model: QuoteModel, as: "quote" }],
                lock: {
                    level: transaction.LOCK.UPDATE,
                    of: this.conversionModel,
                },
                skipLocked: true,
                attributes: ["id", "idempotency_key", "user_id"],
                order: [["created_at", "DESC"], ["id", "DESC"]],
                transaction,
            });
            if (conversions.length === 0) {
                await transaction.commit();
                return null;
            }
            const conversionIds = conversions.map(conversion => conversion.id);
            const [updatedInstanceLength, submittingConversions] =
                await this.conversionModel.update(
                    { status: ConversionStatus.SUBMITTING },
                    {
                        where: {
                            id: conversionIds,
                            status: ConversionStatus.CREATED,
                        },
                        returning: [],
                        transaction,
                    },
                );
            if (conversions.length !== updatedInstanceLength) {
                throw new Error("ERR_UPDATE_LOCKED_INSTANCE");
            }
            await transaction.commit();
            return conversions.map(ConversionsRepository.format);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}
