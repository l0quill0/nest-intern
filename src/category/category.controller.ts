import {
  Body,
  Controller,
  Delete,
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
import { Roles } from 'src/auth/decorators/role.decorator';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/auth/role.enum';
import { CategoryService } from './category.service';
import { CategoryCreateDto } from './dto/category.create.dto';
import 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { CategoryPaginationOptionsDto } from './dto/category.pagination.options.dto';
import { UpdateCategoryDto } from './dto/update.category.dto';

const maxImageSize = 5 * 1024 * 1024;

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('')
  async getPaginatedCategories(@Query() dto: CategoryPaginationOptionsDto) {
    return await this.categoryService.categoryGetPaginated(dto);
  }

  @Get('all')
  async getAllCategories() {
    return await this.categoryService.categoryGetAll();
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Get(':id')
  async getCategoryById(@Param('id') id: number) {
    return await this.categoryService.getCategoryById(id);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async addCategory(
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
    return await this.categoryService.categoryAdd(file, data.name);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async updateCategory(
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
    @Param('id') id: number,
    @Body() data: UpdateCategoryDto,
  ) {
    return await this.categoryService.updateCategory(id, data, file);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Delete(':id')
  async removeCategory(@Param('id', ParseIntPipe) id: number) {
    return await this.categoryService.categoryRemove(id);
  }
}
