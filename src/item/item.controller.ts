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
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Role } from 'src/auth/role.enum';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { BucketService } from 'src/bucket/bucket.service';
import 'multer';
import { CreateItemDto } from './dto/create.item.dto';
import { UpdateItemDto } from './dto/update.item.dto';

const maxImageSize = 5 * 1024 * 1024;

@Controller('item')
export class ItemController {
  constructor(
    private readonly itemService: ItemService,
    private readonly bucketService: BucketService,
  ) {}

  @Get(':id')
  async getItemById(@Param('id') id: number) {
    return await this.itemService.getItemById(id);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Post('create')
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
    const image = await this.bucketService.upload(
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    return await this.itemService.createItem({ image, ...data });
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Patch('update-item-info/:id')
  async updateItemInfo(
    @Body() data: UpdateItemDto,
    @Param('id') itemId: number,
  ) {
    return await this.itemService.updateItemInfo(itemId, data);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Patch('update-item-image/:id')
  @UseInterceptors(FileInterceptor('file'))
  async updateItemImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: maxImageSize }),
          new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Param('id') id: number,
  ) {
    const image = await this.bucketService.upload(
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    return await this.itemService.updateItemImage(id, image);
  }

  @Roles([Role.ADMIN])
  @UseGuards(JwtGuard, RolesGuard)
  @Delete(':id')
  async deleteItem(@Param('id') id: number) {
    return await this.itemService.deleteItem(id);
  }
}
