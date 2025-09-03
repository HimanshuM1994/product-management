export interface UserResponse {
  id: string;
  name: string;
  email: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  price: string;
  description?: string;
  images: string[];
  createdAt: Date;
  user: UserResponse;
}

export interface MetaResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedProductResponse {
  message: string;
  data: ProductResponse[];
  meta: MetaResponse;
}
