# product-management
# NestJS Backend API

A comprehensive NestJS backend with PostgreSQL, TypeORM, JWT authentication, Cloudinary image storage, and Swagger documentation.

## Features

- **Authentication**: JWT-based login & registration with bcrypt password hashing
- **User Management**: User entity with secure password handling
- **Product Management**: Full CRUD operations with pagination and search
- **Image Upload**: Cloudinary integration for secure image storage
- **API Documentation**: Swagger/OpenAPI documentation
- **Database**: PostgreSQL with TypeORM and proper relations
- **Security**: AuthGuard protection and input validation
- **API**: RESTful endpoints with proper response formatting

## Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run start:dev
```

## Environment Variables

Create a `.env` file with the following variables:

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=nestjs_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Cloudinary Configuration (get these from https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Cloudinary Setup

1. Create a free account at [Cloudinary](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Update the `.env` file with your Cloudinary credentials

## API Endpoints

### Documentation
- `GET /api/docs` - Swagger API documentation

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Upload
- `POST /api/upload/single` - Upload a single image (protected)
- `POST /api/upload/multiple` - Upload multiple images (protected)

### Products
- `GET /api/products?page=1&limit=10&search=keyword` - Get paginated products with search
- `POST /api/products` - Create product (protected)
- `POST /api/products/with-images` - Create product with image upload (protected)
- `GET /api/products/:id` - Get single product
- `PUT /api/products/:id` - Update product (protected)
- `DELETE /api/products/:id` - Delete product (protected)

## Database Setup

Make sure PostgreSQL is running and create a database named `nestjs_db` or update the environment variables accordingly.

The application will automatically create the required tables when started.

## API Documentation

Once the application is running, visit `http://localhost:3000/api/docs` to access the interactive Swagger documentation where you can:

- View all available endpoints
- Test API calls directly from the browser
- See request/response schemas
- Authenticate using JWT tokens

## Usage

1. Start by registering a user via `POST /api/auth/register`
2. Login to get a JWT token via `POST /api/auth/login`
3. Use the token in the Authorization header: `Bearer <your-token>`
4. Upload images using the upload endpoints
5. Create and manage products using the protected endpoints

## Image Upload Workflow

1. **Option 1**: Upload images first, then create product with URLs
   - Upload images via `POST /api/upload/multiple`
   - Use returned URLs in product creation

2. **Option 2**: Create product with images in one request
   - Use `POST /api/products/with-images` with form data
   - Include product data and image files together

## Development

```bash
# Start in development mode
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod
```


