export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface PaginationParams {
  page: number;
  size: number;
  sort?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  invalidParams?: Record<string, string>;
}

export interface ApiError {
  message: string;
  status: number;
  problemDetails?: ProblemDetails;
}

export class ApiHttpError extends Error implements ApiError {
  public status: number;
  public data?: unknown;
  public problemDetails?: ProblemDetails;

  constructor(message: string, status: number, data?: unknown, problemDetails?: ProblemDetails) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.data = data;
    this.problemDetails = problemDetails;
  }
}
