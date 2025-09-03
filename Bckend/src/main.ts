import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Client } from 'pg';

// Function to check + create DB if missing
async function ensureDatabaseExists() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'sa123',
    database: 'postgres', 
  });

  const dbName = 'nestjs_db';

  await client.connect();

  const result = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [dbName],
  );

  if (result.rowCount === 0) {
    await client.query(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Database "${dbName}" created successfully`);
  } else {
    console.log(`ℹ️ Database "${dbName}" already exists`);
  }

  await client.end();
}

async function bootstrap() {
  // ✅ Ensure database exists before NestJS starts
  await ensureDatabaseExists();

  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe with multipart form support
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false, // Allow multipart form extra fields
    transform: true, // Enable transformation for class-transformer decorators
    transformOptions: {
      enableImplicitConversion: true, // Convert string numbers to numbers
    },
  }));

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('NestJS Backend API')
    .setDescription('A comprehensive NestJS backend with PostgreSQL, JWT authentication, and Cloudinary image storage')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'NestJS API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(5000);
  console.log('✅ Application is running on: http://localhost:5000');
  console.log('✅ API Documentation: http://localhost:5000/api/docs');
}

bootstrap();
