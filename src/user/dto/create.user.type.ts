import { AuthMethod } from 'src/auth/authMethod.enum';
import { Role } from 'src/auth/role.enum';

export interface ICreateUser {
  email: string;
  name: string;
  password?: string;
  role?: Role;
  authMethod: AuthMethod;
}
