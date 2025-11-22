import { Roles } from 'src/auth/decorators/role.decorator';
import { ItemService } from './item.service';
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
import { Role } from 'src/auth/role.enum';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import { CreateItemDto } from './dto/create.item.dto';
import { UpdateItemDto } from './dto/update.item.dto';

const maxImageSize = 5 * 1024 * 1024;

@Controller('item')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get(':id')
  async getItemById(@Param('id', ParseIntPipe) id: number) {
    return await this.itemService.getItemById(id);
  }

  @Get('')
  async getItems(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('search') search?: string,
    @Query('priceMin') priceMin?: number,
    @Query('priceMax') priceMax?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('category') category?: string[],
  ) {
    return await this.itemService.paginateItems({
      page,
      pageSize,
      search,
      priceMin,
      priceMax,
      sortBy,
      sortOrder,
      category,
    });
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async createItem(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: maxImageSize }),
          new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() data: CreateItemDto,
  ) {
    return await this.itemService.createItem(file, data);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async updateItemInfo(
    @Param('id', ParseIntPipe) itemId: number,
    @Body() data: UpdateItemDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: maxImageSize }),
          new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    return await this.itemService.updateItemInfo(itemId, data, file);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Delete(':id')
  async deleteItem(@Param('id', ParseIntPipe) id: number) {
    return await this.itemService.deleteItem(id);
  }
}
