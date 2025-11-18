import { IsString } from 'class-validator';
import { Role } from 'src/auth/role.enum';

export class BaseUserDto {
  @IsString()
  email: string;
  @IsString()
  name: string;
  role: Role;
}
