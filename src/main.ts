import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Conduit API')
    .setDescription('Your API Design')
    .setVersion('1.0.o')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  app.use('/api-json', (req, res) => {
    res.json(document);
  });

  await app.listen(3000);
}
bootstrap();
