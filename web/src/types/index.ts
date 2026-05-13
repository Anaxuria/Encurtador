export interface LinkItem {
  id: string;
  originalUrl: string;
  shortLink: string;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  limit: number;
  page: number;
  total: number;
}
