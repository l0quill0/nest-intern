import { CommentAuthor } from '../comment.record';
import { Comment } from '../comment.record';

export type TCommentParams = {
  id: number;
  text: string;
  score: number;
  author: CommentAuthor;
};

export type TCreateComment = Omit<TCommentParams, 'author' | 'id'> & {
  userId: number;
  itemId: number;
};

export type TCommentQuery = {
  page: number;
  pageSize: number;
};

export type TCommentColletionParams = {
  items: Comment[];
  totalPages: number;
  currentPage: number;
};

export type TCommentAuthorParams = {
  id: number;
  name: string;
};
