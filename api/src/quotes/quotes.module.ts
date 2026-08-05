import { Module } from "@nestjs/common";
import { QuotesService } from "./quotes.service";
import { QuotesController } from "./quotes.controller";
import { ProviderModule } from "src/provider/provider.module";
@Module({
    imports: [ProviderModule],
    providers: [QuotesService],
    controllers: [QuotesController],
    exports: [QuotesService]
})
export class QuotesModule {}