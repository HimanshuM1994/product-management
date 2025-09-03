import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Put,
  UseInterceptors,
  UploadedFiles,
  BadRequestException
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductWithImagesDto } from './dto/update-product-with-images.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from '../upload/upload.service';
import { successResponse } from 'src/common/apiResponse/response.helper';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly uploadService: UploadService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createProductDto: CreateProductDto, @Request() req) {
    try {
      const product = await this.productService.create(createProductDto, req.user);
      return {
        message: 'Product created successfully',
        data: product,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('with-images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiOperation({ summary: 'Create a product with image upload' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'iPhone 15 Pro' },
        price: { type: 'number', example: 999.99 },
        description: { type: 'string', example: 'Latest iPhone model' },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Product created with images successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data or files' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createWithImages(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req
  ) {
    try {
      let imageUrls: string[] = [];

      if (files && files.length > 0) {
        imageUrls = await this.uploadService.uploadMultiple(files);
      }

      const productData = {
        ...createProductDto,
        images: [...(createProductDto.images || []), ...imageUrls],
      };

      const product = await this.productService.create(productData, req.user);
      // return {
      //   message: 'Product created with images successfully',
      //   data: product,
      // };

      return successResponse(200, 'Product created with images successfully', product);
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with pagination and search' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Product' }
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' }
          }
        }
      }
    }
  })
  async findAll(@Query() queryDto: QueryProductDto) {
    try {
      const result = await this.productService.findAll(queryDto);
       return successResponse(200, 'Products retrieved successfully', result);
      // return {
      //   message: 'Products retrieved successfully',
      //   ...result,
      // };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string) {
    try {
      const product = await this.productService.findOne(id);
      return {
        message: 'Product retrieved successfully',
        data: product,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiOperation({ summary: 'Update a product with optional image upload' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'iPhone 15 Pro Max' },
        price: { type: 'number', example: 1199.99 },
        description: { type: 'string', example: 'Updated iPhone model' },
        existingImages: { 
          type: 'string', 
          example: '["https://example.com/existing1.jpg"]',
          description: 'JSON string array of existing images to keep'
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'New images to upload'
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data or files' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only update own products' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string, 
    @Body() updateProductDto: UpdateProductWithImagesDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req
  ) {
    try {
      console.log('Update request received:', {
        id,
        body: updateProductDto,
        filesCount: files?.length || 0,
        userId: req.user?.id
      });

      let imageUrls: string[] = [];

      // Validate total image count before processing
      let existingImages: string[] = [];
      if (updateProductDto.existingImages) {
        try {
          existingImages = JSON.parse(updateProductDto.existingImages);
        } catch (error) {
          console.warn('Failed to parse existingImages:', error);
          throw new BadRequestException('Invalid existingImages format. Must be a valid JSON array.');
        }
      }

      const totalImageCount = existingImages.length + (files?.length || 0);
      if (totalImageCount > 5) {
        throw new BadRequestException(`Total image count (${totalImageCount}) exceeds maximum of 5 images per product`);
      }

      // Upload new images if provided
      if (files && files.length > 0) {
        console.log('Uploading new images:', files.map(f => ({ name: f.originalname, size: f.size })));
        imageUrls = await this.uploadService.uploadMultiple(files);
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...imageUrls];
      console.log('Final image array:', allImages);

      // Prepare update data
      const updateData = {
        name: updateProductDto.name,
        price: updateProductDto.price,
        description: updateProductDto.description,
        images: allImages,
      };

      const product = await this.productService.update(id, updateData, req.user);
      
      return successResponse(200, 'Product updated successfully', product);
    } catch (error) {
      console.error('Product update error:', error);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete own products' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Param('id') id: string, @Request() req) {
    try {
      await this.productService.remove(id, req.user);
      return {
        message: 'Product deleted successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('test-upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiOperation({ summary: 'Test endpoint for debugging image uploads' })
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  async testUpload(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req
  ) {
    return {
      message: 'Test upload endpoint',
      body,
      filesReceived: files?.length || 0,
      files: files?.map(f => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size
      })) || [],
      user: req.user?.id
    };
  }
}
