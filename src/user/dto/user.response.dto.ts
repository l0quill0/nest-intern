import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @Exclude()
  id: number;

  @Expose()
  role: string;

  @Expose()
  email: string;

  @Expose()
  authFlow: string[];

  @Exclude()
  password: string;

  @Exclude()
  createdAt: Date;
}
