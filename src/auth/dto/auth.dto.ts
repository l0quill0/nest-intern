import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AuthDto {
  @IsOptional()
  @IsString()
  identifier: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
