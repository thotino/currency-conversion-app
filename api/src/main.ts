import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { ValidationPipe } from '@nestjs/common';
import { WebhooksWorker } from './webhooks/webhooks.worker';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  )

  const worker = app.get(WebhooksWorker)

  const config = app.get(AppConfigService);
  await app.listen(config.port, '0.0.0.0');
  await worker.run()
}

void bootstrap();
