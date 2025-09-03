import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

@Entity('products')
export class Product {
  @ApiProperty({ description: 'Product unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Product name', example: 'iPhone 15 Pro' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Product price', example: 999.99 })
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ description: 'Product description', example: 'Latest iPhone model' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ 
    description: 'Array of image URLs', 
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    type: [String]
  })
  @Column('text', { array: true, default: [] })
  images: string[];

  @ApiProperty({ description: 'Product creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Product last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'User ID who owns this product' })
  @Column('uuid')
  userId: string;

  @ApiProperty({ description: 'User who owns this product', type: () => User })
  @ManyToOne(() => User, user => user.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}