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

@Module({
  imports: [AppConfigModule, DatabaseModule, ProviderModule, QuotesModule],
  controllers: [
    HealthController,
    QuotesController,
    ConversionsController,
    WebhooksController,
    BalancesController,
  ],
})
export class AppModule {}
