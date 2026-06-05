import { Order } from '../enums/pagination.enums';

export interface IPaginationDTO<T> {
  offset: number;
  limit: number;
  until: number;
  page?: number;
  order: Order;
  orderField: keyof T;
  filter: Record<string, any>;
}

export interface IPaginationData<T> {
  items: T[];
  count: number;
}

export interface IPaginationResponse<T> {
  items: T[];
  count: number;
  page: number;
  offset: number;
  limit: number;
}
