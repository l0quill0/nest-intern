export interface IPostOfficeApi {
  id: number;
  name: string;
  status: string;
  settlement: {
    id: number;
    name: string;
    region: {
      id: number;
      name: string;
      parent?: {
        id: number;
        name: string;
      };
    };
  };
}

export interface IOfficesPaginatedApi {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  items: IPostOfficeApi[];
}
