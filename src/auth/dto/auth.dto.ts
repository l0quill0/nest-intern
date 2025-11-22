import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
