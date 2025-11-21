import {
  Body,
  Controller,
  Delete,
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

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Post('add')
  async addCategory(@Body() data: CategoryCreateDto) {
    return this.categoryService.categoryAdd(data.name);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Delete('remove/:id')
  async removeCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.categoryRemove(id);
  }
}
