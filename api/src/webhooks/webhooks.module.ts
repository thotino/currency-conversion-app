import { Module } from "@nestjs/common";
import { WebhooksController } from "./webhooks.controller";
import { WebhooksService } from "./webhooks.service";
import { SequelizeModule } from "@nestjs/sequelize";
import { Event } from "./models/events.model";
import { WebhooksRepository } from "./webhooks.repository";

@Module({
    imports: [SequelizeModule.forFeature([Event])],
    controllers: [WebhooksController],
    exports: [WebhooksService],
    providers: [WebhooksService, WebhooksRepository]
})
export class WebhooksModule {}