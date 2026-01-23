import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CommentDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsNumber()
  @Min(0)
  @Max(5)
  score: number;
}
