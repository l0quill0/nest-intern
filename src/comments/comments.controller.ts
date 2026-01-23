import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentPaginationDto } from './dto/comment.pagination.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import * as roleGuard from 'src/auth/guards/role.guard';
import { Me } from 'src/user/decorators/me.decorator';
import { CommentDto } from './dto/comment.dto';

@Controller('product/:productId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  async getByQuery(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() query: CommentPaginationDto,
  ) {
    return await this.commentsService.getByQuery(productId, query);
  }

  @Post()
  @UseGuards(JwtGuard)
  async add(
    @Param('productId', ParseIntPipe) productId: number,
    @Me() user: roleGuard.IUserJWT,
    @Body() body: CommentDto,
  ) {
    return await this.commentsService.add(productId, user.sub, body);
  }

  @Delete(':commentId')
  @UseGuards(JwtGuard)
  async delete(
    @Me() user: roleGuard.IUserJWT,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    return await this.commentsService.delete(productId, user.sub, commentId);
  }
}
