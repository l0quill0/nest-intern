import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/role.decorator';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/auth/role.enum';
import { CategoryService } from './category.service';
import { CategoryCreateDto } from './dto/category.create.dto';
import 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { CategoryPaginationOptionsDto } from './dto/category.pagination.options.dto';
import { ProductCacheService } from 'src/product/product-cache.service';

const maxImageSize = 5 * 1024 * 1024;

@Controller('category')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly productCacheService: ProductCacheService,
  ) {}

  @Get('')
  async getByQuery(@Query() query: CategoryPaginationOptionsDto) {
    return await this.categoryService.getByQuery(query);
  }

  @Get('all')
  getAll() {
    return this.categoryService.getAll();
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.categoryService.getBySlug(slug);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
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
    @Body() data: CategoryCreateDto,
  ) {
    return await this.categoryService.create(file, data.name);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Patch(':slug')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: maxImageSize }),
          new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Param('slug') slug: string,
  ) {
    return await this.categoryService.update(slug, file);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Delete(':slug')
  async delete(@Param('slug') slug: string) {
    await this.productCacheService.deleteShowcase(slug);
    await this.productCacheService.deleteShowcase();

    return await this.categoryService.delete(slug);
  }
}
