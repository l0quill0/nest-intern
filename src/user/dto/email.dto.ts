import { IsEmail, IsString } from 'class-validator';

export class EmailDto {
  @IsString()
  @IsEmail()
  string: number;
}
