import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Role } from 'src/auth/role.enum';

export class BaseUserDto {
  @IsString()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @IsString()
  name: string;
  role: Role;
}
