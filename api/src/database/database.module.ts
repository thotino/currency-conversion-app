import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { AppConfigService } from '../config/app-config.service';

export const PG_POOL = 'PG_POOL';

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): Pool =>
        new Pool({ connectionString: config.databaseUrl }),
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
