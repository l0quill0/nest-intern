import { Password } from '../user.record';

export type TUserParams = {
  id: number;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  password: Password | null;
  createdAt: Date;
  authFlow: string[];
};

export type TCreateUser = Omit<
  TUserParams,
  | 'id'
  | 'role'
  | 'createdAt'
  | 'password'
  | 'authFlow'
  | 'name'
  | 'phone'
  | 'email'
> & {
  name?: string;
  email?: string;
  phone?: string;
  password?: Password;
  authFlow: string;
};

export type TUserFrom = {
  id: number;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  password: string | null;
  createdAt: Date;
  authFlow: { id: number; name: string }[];
};
