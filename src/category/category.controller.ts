import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/role.decorator';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Role } from 'src/auth/role.enum';
import { CategoryService } from './category.service';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Post('add')
  async addCategory(name: string) {
    return this.categoryService.categoryAdd(name);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Post('remove/:id')
  async removeCategory(@Param('id') id: number) {
    return this.categoryService.categoryRemove(id);
  }
}
