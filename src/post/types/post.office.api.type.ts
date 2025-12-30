export interface IPostOfficeApi {
  id: number;
  name: string;
  settlement: {
    region: {
      name: string;
      parent?: {
        name: string;
      };
    };
  };
}
