import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  role: string;

  @Expose()
  email: string;

  @Expose()
  phone: string;

  @Expose()
  authFlow: string[];

  @Exclude()
  password: string;

  @Exclude()
  createdAt: Date;
}
