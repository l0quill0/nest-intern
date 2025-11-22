import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/role.decorator';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/auth/role.enum';
import { CategoryService } from './category.service';
import { CategoryCreateDto } from './dto/category.create.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('')
  async getAllCategories() {
    return await this.categoryService.categoryGetAll();
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Post('')
  async addCategory(@Body() data: CategoryCreateDto) {
    return await this.categoryService.categoryAdd(data.name);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Delete(':id')
  async removeCategory(@Param('id', ParseIntPipe) id: number) {
    return await this.categoryService.categoryRemove(id);
  }
}
