import axios from 'axios';
import { IOfficesPaginatedApi } from './types/offices.paginated.api.type';

export const fetchPage = async (page: number, jwtToken: string) => {
  const response = await axios.get<IOfficesPaginatedApi>(
    `${process.env.NP_BASE_URL}/divisions`,
    {
      headers: {
        Authorization: jwtToken,
      },
      params: {
        limit: 100,
        page,
        countryCodes: ['UA'],
        divisionCategories: ['PostBranch'],
      },
    },
  );

  return response.data;
};
