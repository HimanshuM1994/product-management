import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { User } from '../user/entities/user.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(createProductDto: CreateProductDto, user: User): Promise<Product> {
    const product = this.productRepository.create({
      ...createProductDto,
      userId: user.id,
    });

    return this.productRepository.save(product);
  }

  async findAll(queryDto: QueryProductDto) {
    const { page = '1', limit = '10', search } = queryDto;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const queryBuilder = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.user', 'user')
      .select([
        'product.id',
        'product.name',
        'product.price',
        'product.description',
        'product.images',
        'product.createdAt',
        'user.id',
        'user.name',
        'user.email'
      ]);

    if (search) {
      queryBuilder.where('product.name ILIKE :search OR product.description ILIKE :search', {
        search: `%${search}%`
      });
    }

    const [products, total] = await queryBuilder
      .skip(skip)
      .take(limitNumber)
      .orderBy('product.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: products,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['user'],
      select: {
        user: {
          id: true,
          name: true,
          email: true,
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User): Promise<Product> {
    const product = await this.findOne(id);

    if (product.userId !== user.id) {
      throw new ForbiddenException('You can only update your own products');
    }

    // Validate images array if provided
    if (updateProductDto.images && updateProductDto.images.length > 5) {
      throw new BadRequestException('Maximum 5 images are allowed per product');
    }

    // Ensure images array is not null/undefined - use existing images if not provided
    const updateData = {
      ...updateProductDto,
      images: updateProductDto.images !== undefined ? updateProductDto.images : product.images
    };

    await this.productRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string, user: User): Promise<void> {
    const product = await this.findOne(id);

    if (product.userId !== user.id) {
      throw new ForbiddenException('You can only delete your own products');
    }

    // Delete images from Cloudinary if they exist
    if (product.images && product.images.length > 0) {
      try {
        console.log('Deleting images from Cloudinary:', product.images);
        const imageDeletePromises = product.images.map(async (imageUrl) => {
          try {
            // Extract public_id from Cloudinary URL
            const publicId = this.extractPublicIdFromUrl(imageUrl);
            if (publicId) {
              console.log('Deleting image with public_id:', publicId);
              await this.cloudinaryService.deleteImage(publicId);
            }
          } catch (error) {
            console.warn('Failed to delete image:', imageUrl, error.message);
            // Don't throw error for individual image deletion failures
            // Continue with product deletion even if some images fail to delete
          }
        });
        
        // Wait for all image deletions to complete (or fail)
        await Promise.allSettled(imageDeletePromises);
        console.log('Image deletion process completed');
      } catch (error) {
        console.error('Error during image deletion:', error);
        // Continue with product deletion even if image cleanup fails
      }
    }

    // Delete the product from database
    await this.productRepository.delete(id);
  }

  /**
   * Extract Cloudinary public_id from URL
   * Example: https://res.cloudinary.com/demo/image/upload/v1234567890/nestjs-products/abc123.jpg
   * Returns: nestjs-products/abc123
   */
  private extractPublicIdFromUrl(imageUrl: string): string | null {
    try {
      if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
        return null;
      }

      // Match Cloudinary URL pattern and extract public_id
      const regex = /\/v\d+\/(.*?)(?:\.[^.]+)?$/;
      const match = imageUrl.match(regex);
      
      if (match && match[1]) {
        return match[1]; // This includes folder/filename without extension
      }
      
      return null;
    } catch (error) {
      console.warn('Error extracting public_id from URL:', imageUrl, error);
      return null;
    }
  }
}