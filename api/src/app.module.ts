import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { ProviderModule } from './provider/provider.module';
import { HealthController } from './health/health.controller';
import { QuotesController } from './quotes/quotes.controller';
import { ConversionsController } from './conversions/conversions.controller';
import { WebhooksController } from './webhooks/webhooks.controller';
import { BalancesController } from './balances/balances.controller';
import { QuotesModule } from './quotes/quotes.module';
import { ConversionsModule } from './conversions/conversions.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppConfigService } from './config/app-config.service';
import { Conversion } from './conversions/models/conversions.model';
const config: AppConfigService = new AppConfigService()
@Module({
  imports: [AppConfigModule, DatabaseModule, ProviderModule, QuotesModule, ConversionsModule, SequelizeModule.forRoot({ uri: config.databaseUrl, models: [Conversion], autoLoadModels: true })],
  controllers: [
    HealthController,
    QuotesController,
    ConversionsController,
    WebhooksController,
    BalancesController,
  ],
})
export class AppModule {}
