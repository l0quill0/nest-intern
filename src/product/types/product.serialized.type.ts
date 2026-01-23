interface ISerializedProduct {
  id: number;
  title: string;
  image: string;
  price: number;
  category: {
    id: number;
    name: string;
    slug: string;
    image: string;
  };
  createdAt: Date;
  isRemoved: boolean;
  description: string;
}

export interface ISerializedView {
  items: ISerializedProduct[];
  currentPage: number;
  totalPages: number;
}
