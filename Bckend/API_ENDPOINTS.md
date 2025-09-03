# Product API Endpoints

## Updated Backend for Frontend Image Management

### Base URL: `http://localhost:5000/api`

## Authentication
All product endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Product Endpoints

### 1. Create Product with Images
**POST** `/products/with-images`
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `name` (string, required): Product name
  - `price` (number, required): Product price
  - `description` (string, optional): Product description
  - `images` (files, optional): Up to 5 image files (JPG, PNG, WebP, GIF, max 10MB each)

### 2. Update Product with Images
**PUT** `/products/{id}`
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `name` (string, optional): Product name
  - `price` (number, optional): Product price
  - `description` (string, optional): Product description
  - `existingImages` (string, optional): JSON array of existing image URLs to keep
    - Example: `["https://cloudinary.com/image1.jpg", "https://cloudinary.com/image2.jpg"]`
  - `images` (files, optional): New image files to upload

**Example Frontend Usage:**
```javascript
const formData = new FormData();
formData.append('name', 'Updated Product Name');
formData.append('price', '299.99');
formData.append('description', 'Updated description');

// Keep existing images
const existingImages = ['https://cloudinary.com/image1.jpg'];
formData.append('existingImages', JSON.stringify(existingImages));

// Add new images
newImageFiles.forEach(file => {
  formData.append('images', file);
});

// Send PUT request
fetch('/api/products/123', {
  method: 'PUT',
  body: formData,
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### 3. Get All Products
**GET** `/products`
- **Query Parameters**:
  - `page` (number, optional): Page number (default: 1)
  - `limit` (number, optional): Items per page (default: 10)
  - `search` (string, optional): Search term

### 4. Get Single Product
**GET** `/products/{id}`

### 5. Delete Product
**DELETE** `/products/{id}`

### 6. Test Upload Endpoint (for debugging)
**POST** `/products/test-upload`
- **Content-Type**: `multipart/form-data`
- Returns information about received files and form data

## Image Management Features

### Frontend Integration
The backend now properly handles:

1. **Product Creation**: Upload multiple images during product creation
2. **Product Update**: 
   - Keep existing images by sending their URLs in `existingImages` 
   - Add new images via `images` files
   - Remove images by omitting them from `existingImages`
3. **Validation**: 
   - Maximum 5 images per product
   - File size limit: 10MB per image
   - Supported formats: JPG, PNG, WebP, GIF
4. **Error Handling**: Comprehensive error messages for validation failures

### Error Responses
- `400 Bad Request`: Invalid data, file validation errors, or image count limits
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Attempting to modify another user's product
- `404 Not Found`: Product not found
- `413 Payload Too Large`: File size exceeds 10MB limit

### Response Format
All responses follow the format:
```json
{
  "statusCode": 200,
  "message": "Operation successful",
  "resultData": { ... }
}
```

## Running the Backend

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm run start:dev
   ```

3. Access API documentation:
   ```
   http://localhost:5000/api/docs
   ```

## Database
- PostgreSQL database named `nestjs_db`
- Auto-created if not exists
- Images stored on Cloudinary (URLs saved in database)
