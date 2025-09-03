// src/common/helpers/response.helper.ts

export interface SuccessResponse<T = any> {
  success: true;
  statusCode: number;
  message: string;
  resultData?: T;
}

export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error?: any; // optional detailed error
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

export function successResponse<T>(
  statusCode: number,
  message: string,
  resultData?: T,
): SuccessResponse<T> {
  return {
    success: true,
    statusCode,
    message,
    resultData,
  };
}

export function errorResponse(
  statusCode: number,
  message: string,
  error?: any,
): ErrorResponse {
  return {
    success: false,
    statusCode,
    message,
    error,
  };
}
