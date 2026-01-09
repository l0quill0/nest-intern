import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { CreateUserDto } from 'src/user/dto/create.user.dto';
import { GoogleAuthDto } from './dto/google.auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() user: CreateUserDto) {
    return await this.authService.register(user);
  }

  @Post('login')
  async login(@Body() { email, password }: AuthDto) {
    return (
      (await this.authService.validateUser({ email, password })) &&
      (await this.authService.login(email))
    );
  }

  @Post('google')
  async loginGoogle(@Body() body: GoogleAuthDto) {
    return await this.authService.authGoogle(body);
  }
}
