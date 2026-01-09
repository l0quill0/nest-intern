import { IsEmail, IsString } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  name: string;
}
