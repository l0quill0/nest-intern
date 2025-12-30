import { IPostOfficeApi } from './post.office.api.type';

export interface IOfficesPaginatedApi {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  items: IPostOfficeApi[];
}
