import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from "vitest";
import { Event as EventModel } from "../models/events.model";
import { Conversion as ConversionModel } from "src/conversions/models/conversions.model";
import { WebhooksRepository } from "../webhooks.repository";
import { Test } from "@nestjs/testing";
import { Sequelize } from "sequelize-typescript";
import { getModelToken } from "@nestjs/sequelize";
import {
    ConversionStatus,
    Currency,
    WebhookEventDataStatus,
    WebhookEventProcessingStatus,
} from "src/constants";
import { Op, literal } from "sequelize";
import { WebhookEvent } from "src/types";
describe("WebhooksRepository", () => {
    let webhooksRepository: WebhooksRepository;
    const transactionMock = {
        commit: vi.fn(),
        rollback: vi.fn(),
        LOCK: { UPDATE: "UPDATE" },
    };
    const sequelizeMock = {
        transaction: vi.fn().mockResolvedValue(transactionMock),
        escape: vi.fn((value: string) => `'${value}'`),
    };
    const eventModelMock = {
        findAll: vi.fn(),
        update: vi.fn(),
    };
    const conversionModelMock = {
        findAll: vi.fn(),
    };
    beforeEach(async () => {
        sequelizeMock.transaction.mockResolvedValue(transactionMock);
        const moduleRef = await Test.createTestingModule({
            providers: [
                WebhooksRepository,
                { provide: Sequelize, useValue: sequelizeMock },
                {
                    provide: getModelToken(EventModel),
                    useValue: eventModelMock,
                },
                {
                    provide: getModelToken(ConversionModel),
                    useValue: conversionModelMock,
                },
            ],
        }).compile();
        webhooksRepository = moduleRef.get(WebhooksRepository);
    });
    describe("findAllPendingEvents", () => {
        test("should request using the processing status and order by the event occurrence date", async () => {
            eventModelMock.findAll.mockResolvedValueOnce([]);
            await webhooksRepository.findAllPendingEvents();
            expect(eventModelMock.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    transaction: transactionMock,
                    lock: transactionMock.LOCK.UPDATE,
                    where: {
                        event_processing_status:
                            WebhookEventProcessingStatus.PENDING,
                    },
                    order: [["event_occurred_at", "ASC"]],
                }),
            );
            expect(transactionMock.commit).toHaveBeenCalledOnce();
        });
        test("should return null if no pending event is found", async () => {
            eventModelMock.findAll.mockResolvedValueOnce([]);
            const pendingEvents =
                await webhooksRepository.findAllPendingEvents();
            expect(pendingEvents).toEqual(null);
        });
        test("should throw an error if updated events are not equal to pending events", async () => {
            eventModelMock.findAll.mockResolvedValueOnce(
                Array.from({ length: 10 }, (_, id) => {
                    return { id };
                }),
            );
            eventModelMock.update.mockResolvedValueOnce([5]);

            await expect(
                webhooksRepository.findAllPendingEvents(),
            ).rejects.toThrow("ERR_UPDATE_LOCKED_INSTANCE");
        });
        test("should update the selected pending events to processing", async () => {
            eventModelMock.findAll.mockResolvedValueOnce(
                Array.from({ length: 10 }, (_, id) => {
                    return { id };
                }),
            );
            eventModelMock.update.mockResolvedValueOnce([10]);
            const pendingEvents =
                await webhooksRepository.findAllPendingEvents();
            expect(eventModelMock.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    event_processing_status:
                        WebhookEventProcessingStatus.PROCESSING,
                }),
                {
                    where: expect.objectContaining({
                        id: {
                            [Op.in]: Array.from({ length: 10 }, (_, id) => id),
                        },
                        event_processing_status:
                            WebhookEventProcessingStatus.PENDING,
                    }),
                    transaction: transactionMock,
                },
            );
        });
        test("should return the processing events", async () => {
            eventModelMock.findAll.mockResolvedValueOnce(
                Array.from({ length: 10 }, (_, id) => {
                    return { id, event_id: id, event_payload: null };
                }),
            );
            eventModelMock.update.mockResolvedValueOnce([10]);
            const pendingEvents =
                await webhooksRepository.findAllPendingEvents();
            expect(pendingEvents).toHaveLength(10);
        });
    });
    describe("updateConversions", () => {
        test("should use the model to find the conversions", async () => {
            const processingEvents: WebhookEvent[] = [
                {
                    id: "01",
                    eventId: "01",
                    type: "conversion.accepted",
                    providerRef: "prv_01",
                    occurredAt: new Date(),
                    status: WebhookEventProcessingStatus.PROCESSING,
                    payload: {
                        status: WebhookEventDataStatus.ACCEPTED,
                        providerRef: "prv_01",
                        externalReference: "conv_01",
                        sourceAmount: 1,
                        sourceCurrency: Currency.EUR,
                        targetCurrency: Currency.USD,
                    },
                },
            ];
            conversionModelMock.findAll.mockResolvedValueOnce([]);
            await webhooksRepository.updateConversions(processingEvents);
            expect(conversionModelMock.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        [Op.and]: expect.arrayContaining([
                            literal(
                                expect.stringContaining(
                                    "(id, provider_ref) IN (('conv_01', 'prv_01'))",
                                ),
                            ),
                            {
                                status: {
                                    [Op.in]: expect.arrayContaining([
                                        ConversionStatus.SUBMITTING,
                                        ConversionStatus.SUBMITTED,
                                        ConversionStatus.UNKNOWN,
                                        ConversionStatus.ACCEPTED,
                                        ConversionStatus.PENDING,
                                        ConversionStatus.COMPLETED,
                                        ConversionStatus.REJECTED,
                                    ]),
                                },
                            },
                        ]),
                    },
                }),
            );
        });
        test("should update events back to pending status if no conversion is found", async () => {
            const processingEvents: WebhookEvent[] = [
                {
                    id: "01",
                    eventId: "01",
                    type: "conversion.accepted",
                    providerRef: "prv_01",
                    occurredAt: new Date(),
                    status: WebhookEventProcessingStatus.PROCESSING,
                    payload: {
                        status: WebhookEventDataStatus.ACCEPTED,
                        providerRef: "prv_01",
                        externalReference: "conv_01",
                        sourceAmount: 1,
                        sourceCurrency: Currency.EUR,
                        targetCurrency: Currency.USD,
                    },
                },
            ];
            conversionModelMock.findAll.mockResolvedValueOnce([]);
            await webhooksRepository.updateConversions(processingEvents);
            expect(eventModelMock.update).toHaveBeenCalledWith(
                {
                    event_processing_status:
                        WebhookEventProcessingStatus.PENDING,
                },
                expect.objectContaining({
                    where: {
                        id: { [Op.in]: ["01"] },
                        event_processing_status:
                            WebhookEventProcessingStatus.PROCESSING,
                    },
                }),
            );
        });
    });
});
