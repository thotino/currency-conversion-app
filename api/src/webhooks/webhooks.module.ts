import { Module } from "@nestjs/common";
import { WebhooksController } from "./webhooks.controller";
import { WebhooksService } from "./webhooks.service";
import { SequelizeModule } from "@nestjs/sequelize";
import { Event } from "./models/events.model";
import { WebhooksRepository } from "./webhooks.repository";
import { WebhooksWorker } from "./webhooks.worker";
import { ProviderModule } from "src/provider/provider.module";
import { QuotesModule } from "src/quotes/quotes.module";
import { ConversionsModule } from "src/conversions/conversions.module";
import { Conversion } from "src/conversions/models/conversions.model";

@Module({
    imports: [SequelizeModule.forFeature([Event, Conversion]), ProviderModule, QuotesModule, ConversionsModule],
    controllers: [WebhooksController],
    exports: [WebhooksService, WebhooksWorker],
    providers: [WebhooksService, WebhooksRepository, WebhooksWorker]
})
export class WebhooksModule {}