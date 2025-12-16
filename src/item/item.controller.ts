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
import * as roleGuard from 'src/auth/guards/role.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import { CreateItemDto } from './dto/create.item.dto';
import { UpdateItemDto } from './dto/update.item.dto';
import { ItemPaginationOptionsDto } from './dto/item.pagination.options.dto';
import { Me } from 'src/user/decorators/me.decorator';

const maxImageSize = 5 * 1024 * 1024;

@Controller('item')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get(':id')
  async getItemById(
    @Param('id', ParseIntPipe) id: number,
    @Me() user?: roleGuard.IUserJWT,
  ) {
    return await this.itemService.getItemById(id, user?.sub);
  }

  @Get('')
  async getItems(@Query() dto: ItemPaginationOptionsDto) {
    return await this.itemService.paginateItems(dto);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, roleGuard.RolesGuard)
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
  @UseGuards(JwtGuard, roleGuard.RolesGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async updateItemInfo(
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
    @Body() data: UpdateItemDto,
  ) {
    return await this.itemService.updateItemInfo(itemId, data, file);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, roleGuard.RolesGuard)
  @Patch('return/:id')
  async restoreItem(@Param('id', ParseIntPipe) itemId: number) {
    return await this.itemService.restoreItem(itemId);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, roleGuard.RolesGuard)
  @Delete(':id')
  async deleteItem(@Param('id', ParseIntPipe) id: number) {
    return await this.itemService.deleteItem(id);
  }
}
