import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Conversion } from './models/conversions.model';
import { ConversionsController } from './conversions.controller';
import { ConversionsService } from './conversions.service';
import { ProviderModule } from 'src/provider/provider.module';
import { ConversionsRepository } from './conversions.repository';
import { QuotesModule } from 'src/quotes/quotes.module';
import { Quote } from 'src/quotes/models/quotes.model';

@Module({
  imports: [SequelizeModule.forFeature([Conversion, Quote]), ProviderModule, QuotesModule],
  providers: [ConversionsService, ConversionsRepository],
  controllers: [ConversionsController],
  exports: [ConversionsService, ConversionsRepository]
})
export class ConversionsModule {}