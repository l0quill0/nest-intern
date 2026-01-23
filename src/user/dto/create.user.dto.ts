import { IsNotEmpty, IsString } from 'class-validator';
import { UserDto } from './user.dto';

export class CreateUserDto extends UserDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}
