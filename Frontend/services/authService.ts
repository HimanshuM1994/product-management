import axios from "axios";
import { LoginRequest, LoginResponse } from "../app/interfaces/auth.interface";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", data);
  return response.data;
}

export async function register(data: {
  name: string;
  email: string;
  password: string;
}) {
  const response = await api.post('/auth/register', data);
  return response.data; 
}
