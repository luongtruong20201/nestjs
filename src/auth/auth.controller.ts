import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { Public, ResponseMessage, User } from 'src/decorators/customize';
import { UsersService } from 'src/users/users.service';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { Request, Response } from 'express';
import { IUser } from 'src/users/users.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @ResponseMessage('User login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(req.user, res);
  }

  @ResponseMessage('Register a new user')
  @Public()
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    const user = await this.usersService.register(registerUserDto);
    return { _id: user._id, createdAt: user.createdAt };
  }

  @ResponseMessage('Register a new user')
  @Get('account')
  account(@User() user: IUser) {
    return { user };
  }

  @ResponseMessage('Get user by refresh token')
  @Public()
  @Get('refresh')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refresh_token = req.cookies['refresh_token'];
    const result = await this.authService.processRefreshToken(
      refresh_token,
      res,
    );
    return result;
  }

  @ResponseMessage('User logout')
  @Post('logout')
  async logout(@User() user, @Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_tokeb');
    const result = await this.authService.logout(user);
    return result;
  }
}
