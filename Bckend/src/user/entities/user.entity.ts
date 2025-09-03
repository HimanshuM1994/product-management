import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../product/entities/product.entity';

@Entity('users')
export class User {
  @ApiProperty({ description: 'User unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @Column()
  name: string;

  @ApiProperty({ description: 'User email address', example: 'john.doe@example.com' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ description: 'User hashed password' })
  @Column()
  @Exclude()
  password: string;

  @ApiProperty({ description: 'User creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'User last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Products owned by this user', type: () => [Product] })
  @OneToMany(() => Product, product => product.user)
  products: Product[];
}