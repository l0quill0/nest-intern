import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { UserDto } from './dto/user.dto';
import { Password, User } from './user.record';
import { AuthFlow } from 'src/auth/authFlow.enum';

export const USER_NOT_FOUND = 'USER_NOT_FOUND';
export const PASSWORDS_DONT_MATCH = 'PASSWORDS_DONT_MATCH';
export const FLOW_COMPLETED = 'FLOW_COMPLETED';
export const BASIC_FLOW_INCOMPLETE = 'BASIC_FLOW_INCOMPLETE';
export const ERROR_CREATING_USER = 'ERROR_CREATING_USER';

const updateUserKeys = ['name', 'email', 'authFlow', 'phone'];

@Injectable()
export class UserService {
  async getByEmail(email: string) {
    return await User.getByEmail(email);
  }

  async getCount(userId: number) {
    const user = await User.getById(userId);
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    return user.getCount();
  }

  async update(userId: number, data: UserDto) {
    const user = await User.getById(userId);
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

    for (const key of updateUserKeys) {
      if (key === 'phone' && data[key] !== undefined) {
        user[key] = data[key].replaceAll('+', '');
        continue;
      }
      if (data[key] !== undefined && key in user) {
        user[key] = data[key] as User[keyof User];
      }
    }

    return await user.update();
  }

  async updatePassword(
    userId: number,
    { oldPassword, newPassword }: UpdatePasswordDto,
  ) {
    const user = await User.getById(userId);
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    if (!user.password)
      throw new HttpException(BASIC_FLOW_INCOMPLETE, HttpStatus.BAD_REQUEST);

    const isMatch = await user.password.compare(oldPassword);
    if (!isMatch)
      throw new HttpException(PASSWORDS_DONT_MATCH, HttpStatus.BAD_REQUEST);

    await user.password.change(newPassword);

    return await user.update();
  }

  async addPassword(userId: number, password: string) {
    const user = await User.getById(userId);
    if (!user) throw new HttpException(USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    if (user.password)
      throw new HttpException(FLOW_COMPLETED, HttpStatus.BAD_REQUEST);

    user.password = await Password.hashed(password);
    user.authFlow.push(AuthFlow.BASIC);

    return await user.update();
  }
}
