import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { IOfficesPaginatedApi } from './types/offices.paginated.api.type';
import pLimit from 'p-limit';
import { IPostOfficeApi } from './types/post.office.api.type';

@Injectable()
export class PostService {
  constructor(private readonly httpService: HttpService) {}

  async fetchPostOffices() {
    const response = await firstValueFrom(
      this.httpService.get<{ jwt: string }>(
        `${process.env.NP_BASE_URL}/clients/authorization/`,
        {
          params: {
            apiKey: process.env.NP_API_KEY,
          },
        },
      ),
    );

    const jwtToken = response.data.jwt;

    if (!jwtToken)
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);

    const limit = pLimit(8);

    const fetchPage = async (page: number) => {
      const response = await firstValueFrom(
        this.httpService.get<IOfficesPaginatedApi>(
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
              statuses: ['Working'],
            },
          },
        ),
      );
      return response.data;
    };

    const firstPage = await fetchPage(1);

    const requests: Promise<IPostOfficeApi[]>[] = [];

    for (let page = 2; page <= firstPage.last_page; page++) {
      requests.push(limit(() => fetchPage(page).then((data) => data.items)));
    }

    const otherPages = await Promise.all(requests);

    const rawPostOffice = [...firstPage.items, ...otherPages.flat()];

    const formatedPostOffice = rawPostOffice.map((office) => {
      return {
        id: office.id,
        name: office.name || undefined,
        region:
          office.settlement.region.parent?.name ??
          office.settlement.region.name,
      };
    });

    return formatedPostOffice;
  }
}
