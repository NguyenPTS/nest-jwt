import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { config } from 'dotenv';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

config(); // Load environment variables from .env file

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public')); // Serve static assets
  app.setBaseViewsDir(join(__dirname, '..', 'views')); // Set views directory
  app.setViewEngine('ejs');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('NestJS JWT API')
    .setDescription('API documentation for the NestJS JWT project')
    .setVersion('1.0')
    .addBearerAuth() // Add Bearer token authentication
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Swagger UI available at /api

  const port = process.env.PORT || 3000; // Default to port 3000 if undefined
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
