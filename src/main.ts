import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ENABLE CORS FOR FRONTEND
  app.enableCors({
    origin: [
      'http://localhost:5173', // FE Vite (development)
      'https://gooblog.vercel.app', // FE Vercel (production)
    ],
    methods: 'GET,POST,PUT,PATCH,DELETE',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Blog APIs')
    .setDescription('List APIs for simple blog application')
    .setVersion('1.0')
    .addTag('Auth')
    .addTag('Users')
    .addTag('Friend')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
