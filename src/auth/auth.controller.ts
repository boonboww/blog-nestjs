import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthService } from './auth.service';
import { User } from 'src/user/entities/user.entity';
import { LoginUserDto } from './dto/login-user.dto';
import { ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto): Promise<User> {
    console.log(registerUserDto);
    return await this.authService.register(registerUserDto);
  }

  @Post('login')
  @ApiResponse({ status: 200, description: 'Login successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UsePipes(ValidationPipe)
  login(@Body() loginUserDto: LoginUserDto): Promise<any> {
    console.log(loginUserDto);
    return this.authService.login(loginUserDto);
  }

  @Post('refresh-token')
  refreshToken(@Body() { refresh_token }): Promise<any> {
    console.log('refresh_token');
    return this.authService.refreshToken(refresh_token);
  }
}
