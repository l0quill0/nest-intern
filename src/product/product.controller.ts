import { Roles } from 'src/auth/decorators/role.decorator';
import { ProductService } from './product.service';
import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Role } from 'src/auth/role.enum';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import * as roleGuard from 'src/auth/guards/role.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import { Me } from 'src/user/decorators/me.decorator';
import { SuggestionQueryDto } from './dto/suggestions.query.dto';
import { OptionalJwtGuard } from 'src/auth/guards/optional.jwt.guard';
import { ProductQueryDto } from './dto/product.query.dto';
import { CreateProductDto } from './dto/create.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';
import { ProductCacheService } from './product-cache.service';

const maxImageSize = 5 * 1024 * 1024;

const queryKeys = [
  'page',
  'pageSize',
  'priceMin',
  'priceMax',
  'sortBy',
  'sortOrder',
  'category',
  'showRemoved',
];

@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productCacheService: ProductCacheService,
  ) {}

  @Get('suggestions')
  async getSuggestion(@Query() query: SuggestionQueryDto) {
    return await this.productService.getSuggestions(query);
  }

  @UseGuards(OptionalJwtGuard)
  @Get(':id')
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @Me() user?: roleGuard.IUserJWT,
  ) {
    return await this.productService.getById(id, user?.sub);
  }

  @Get('')
  async getByQuery(@Query() query: ProductQueryDto) {
    const isShowCase = queryKeys.reduce((acc, key) => {
      if (
        key === 'category' &&
        (query[key] === undefined || query[key].length > 1)
      )
        acc = false;
      if (key !== 'category' && query[key] !== undefined) acc = false;
      return acc;
    }, true);
    const showcaseCategory = query['category']?.at(0);

    if (isShowCase && showcaseCategory) {
      const cached =
        await this.productCacheService.getShowcase(showcaseCategory);
      if (cached) return cached;

      const res = await this.productService.getByQuery(query);
      await this.productCacheService.addShowcase(showcaseCategory, res);

      return res;
    }

    return await this.productService.getByQuery(query);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, roleGuard.RolesGuard)
  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: maxImageSize }),
          new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() data: CreateProductDto,
  ) {
    return await this.productService.create(file, data);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, roleGuard.RolesGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: maxImageSize }),
          new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Param('id', ParseIntPipe) itemId: number,
    @Body() data: UpdateProductDto,
  ) {
    return await this.productService.update(itemId, data, file);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, roleGuard.RolesGuard)
  @Patch(':id/unarchive')
  async unArchive(@Param('id', ParseIntPipe) itemId: number) {
    return await this.productService.unArchive(itemId);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, roleGuard.RolesGuard)
  @Patch(':id/archive')
  async archive(@Param('id', ParseIntPipe) id: number) {
    return await this.productService.archive(id);
  }
}
