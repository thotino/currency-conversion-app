import { Module } from "@nestjs/common";
import { WebhooksController } from "./webhooks.controller";
import { WebhooksService } from "./webhooks.service";
import { ConversionsModule } from "src/conversions/conversions.module";

@Module({
    imports: [ConversionsModule],
    controllers: [WebhooksController],
    exports: [WebhooksService],
    providers: [WebhooksService]
})
export class WebhooksModule {}