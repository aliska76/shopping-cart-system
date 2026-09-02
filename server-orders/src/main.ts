import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { JsonLogger } from './common/logging/json-logger';

async function bootstrap() {
  // bodyParser: false -- the default body parsers Nest wires up have no explicit size limit
  // (express's own default is 100kb for json, but that's incidental, not a deliberate choice
  // made by this app). Turning the default off and wiring json/urlencoded back up explicitly
  // below, with a real configured limit, means the limit is a first-class setting
  // (BODY_SIZE_LIMIT) instead of an accident of whatever express happens to default to.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new JsonLogger(),
    bodyParser: false,
  });

  // Unversioned, prefix-free /health (see HealthController) -- excluded here so it stays
  // reachable outside the "api/v1/..." prefix and version segment.
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);

  const bodySizeLimit = configService.get<string>('bodySizeLimit', '1mb');
  app.useBodyParser('json', { limit: bodySizeLimit });
  app.useBodyParser('urlencoded', { limit: bodySizeLimit, extended: true });

  app.enableCors({ origin: configService.get<string[]>('cors.allowedOrigins') });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Orders API')
    .setDescription('Order creation and history for the shopping-cart-system take-home assignment.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document);

  const port = configService.get<number>('port', 3001);
  await app.listen(port);
}

bootstrap();
