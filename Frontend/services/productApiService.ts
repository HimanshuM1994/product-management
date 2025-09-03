// services/apiService.ts
import axios from 'axios';
import { axiosInstance } from './axiosInstance';

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    images: string[];
    createdAt: string;
    user?: User;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const API_BASE = 'http://localhost:5000/api/products';

class ProductApiService {
    // Get all products with optional pagination and search
    async getProducts(page: number = 1, limit: number = 5, search: string = ''): Promise<PaginatedResponse<Product>> {
        const params: Record<string, any> = { page, limit };
        if (search) params.search = search;
        const response = await axios.get(API_BASE, { params });
        const resultData = response.data.resultData;

        return {
            data: resultData.data,
            total: resultData.meta.total,
            page: resultData.meta.page,
            limit: resultData.meta.limit,
            totalPages: resultData.meta.totalPages
        };
    }
    // Get single product by ID
    async getProductById(id: string): Promise<Product | null> {
        try {
            const response = await axios.get(`${API_BASE}/${id}`);
            return response.data.resultData;
        } catch (error) {
            console.error('Error fetching product:', error);
            return null;
        }
    }

    // Create new product
    async createProduct(data: FormData | Omit<Product, 'id' | 'user' | 'createdAt'>) {
        if (data instanceof FormData) {
            console.log('Creating product with images', data);
            const response = await axiosInstance.post('/products/with-images', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data.resultData;
        } else {
            const response = await axiosInstance.post('/products', data);
            return response.data.resultData;
        }
    }



    async updateProduct(id: string, data: FormData | Omit<Product, 'id' | 'user' | 'createdAt'>) {
        try {
            if (data instanceof FormData) {
                console.log('Updating product with images', data);
                const response = await axiosInstance.put(`/products/${id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                return response.data.resultData;
            } else {
                const response = await axiosInstance.put(`/products/${id}`, data, {
                    headers: { 'Content-Type': 'application/json' },
                });
                return response.data.resultData;
            }
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    // Delete product
    async deleteProduct(id: string): Promise<boolean> {
        try {
            const response = await axios.delete(`${API_BASE}/${id}`);
            return response.data.success;
        } catch (error) {
            console.error('Error deleting product:', error);
            return false;
        }
    }
}

export const productApiService = new ProductApiService();
