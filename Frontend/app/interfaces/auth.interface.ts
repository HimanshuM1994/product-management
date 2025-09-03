export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resultData?: {
    access_token: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resultData: {
    message: string;
    access_token: string;
    user: User;
  };
}
