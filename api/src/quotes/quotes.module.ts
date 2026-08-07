import { Module } from "@nestjs/common";
import { QuotesService } from "./quotes.service";
import { QuotesController } from "./quotes.controller";
import { ProviderModule } from "src/provider/provider.module";
import { SequelizeModule } from "@nestjs/sequelize";
import { Quote } from "./models/quotes.model";
import { QuotesRepository } from "./quotes.repository";
@Module({
    imports: [SequelizeModule.forFeature([Quote]), ProviderModule],
    providers: [QuotesService, QuotesRepository],
    controllers: [QuotesController],
    exports: [QuotesService, QuotesRepository]
})
export class QuotesModule {}