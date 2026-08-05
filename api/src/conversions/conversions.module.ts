import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Conversion } from './models/conversions.model';
import { ConversionsController } from './conversions.controller';
import { ConversionsService } from './conversions.service';
import { ProviderModule } from 'src/provider/provider.module';
import { ConversionsRepository } from './conversions.repository';

@Module({
  imports: [SequelizeModule.forFeature([Conversion]), ProviderModule],
  providers: [ConversionsService, ConversionsRepository],
  controllers: [ConversionsController],
  exports: [ConversionsService]
})
export class ConversionsModule {}