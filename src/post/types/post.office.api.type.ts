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
