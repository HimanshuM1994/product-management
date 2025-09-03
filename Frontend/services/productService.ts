export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ProductService {
  private storageKey = 'products';

  // Get all products with pagination
  async getProducts(page: number = 1, limit: number = 5): Promise<PaginatedResponse<Product>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const products = this.getAllProducts();
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = products.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      total: products.length,
      page,
      limit,
      totalPages: Math.ceil(products.length / limit)
    };
  }

  // Get single product by ID
  async getProductById(id: string): Promise<Product | null> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const products = this.getAllProducts();
    return products.find(p => p.id === id) || null;
  }

  // Create new product
  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const products = this.getAllProducts();
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  }

  // Update existing product
  async updateProduct(id: string, productData: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product | null> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const products = this.getAllProducts();
    const index = products.findIndex(p => p.id === id);

    if (index === -1) return null;

    const updatedProduct: Product = {
      ...products[index],
      ...productData,
      updatedAt: new Date().toISOString()
    };

    products[index] = updatedProduct;
    this.saveProducts(products);
    return updatedProduct;
  }

  // Delete product
  async deleteProduct(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const products = this.getAllProducts();
    const filteredProducts = products.filter(p => p.id !== id);

    if (filteredProducts.length === products.length) {
      return false; // Product not found
    }

    this.saveProducts(filteredProducts);
    return true;
  }

  // Search products
  async searchProducts(query: string, page: number = 1, limit: number = 5): Promise<PaginatedResponse<Product>> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const allProducts = this.getAllProducts();
    const filteredProducts = allProducts.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase())
    );

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredProducts.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      total: filteredProducts.length,
      page,
      limit,
      totalPages: Math.ceil(filteredProducts.length / limit)
    };
  }

  // Private helper methods
  private getAllProducts(): Product[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      // Initialize with mock data
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Wireless Headphones',
          price: 199.99,
          description: 'High-quality wireless headphones with noise cancellation and premium sound quality',
          images: ['https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg?auto=compress&cs=tinysrgb&w=400'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Smart Watch',
          price: 299.99,
          description: 'Advanced smartwatch with health monitoring features and GPS tracking',
          images: ['https://images.pexels.com/photos/267394/pexels-photo-267394.jpeg?auto=compress&cs=tinysrgb&w=400'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Laptop Stand',
          price: 89.99,
          description: 'Ergonomic aluminum laptop stand with adjustable height and cooling design',
          images: ['https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=400'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Wireless Mouse',
          price: 49.99,
          description: 'Precision wireless mouse with ergonomic design and long battery life',
          images: ['https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg?auto=compress&cs=tinysrgb&w=400'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '5',
          name: 'USB-C Hub',
          price: 79.99,
          description: 'Multi-port USB-C hub with HDMI, USB 3.0, and power delivery support',
          images: ['https://images.pexels.com/photos/163100/circuit-circuit-board-resistor-computer-163100.jpeg?auto=compress&cs=tinysrgb&w=400'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '6',
          name: 'Bluetooth Speaker',
          price: 129.99,
          description: 'Portable Bluetooth speaker with 360-degree sound and waterproof design',
          images: ['https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=400'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      this.saveProducts(mockProducts);
      return mockProducts;
    }

    return JSON.parse(stored);
  }

  private saveProducts(products: Product[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(products));
    }
  }
}

export const productService = new ProductService();