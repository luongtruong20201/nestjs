import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import ms from 'ms';
import { RolesService } from 'src/roles/roles.service';
import { IUser } from 'src/users/users.interface';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rolesService: RolesService,
  ) {}

  async validateUser(username: string, pass: string) {
    const user = await this.usersService.findOneByEmail(username);
    if (user && user.password) {
      const isMatch = this.usersService.matchPassword(pass, user.password);
      if (isMatch) {
        const userRole = user.role as unknown as { _id: string; name: string };
        const temp = (await this.rolesService.findOne(userRole._id)) as any;

        const objUser = {
          ...user.toObject(),
          permissions: temp?.permissions ?? [],
        };

        return objUser;
      }
    }
    return null;
  }

  async login(user: IUser, res: Response) {
    const { _id, email, name, role, permissions } = user;
    const payload = {
      sub: 'token login',
      iss: 'from server',
      _id,
      email,
      name,
      role,
    };
    const refresh_token = this.createRefreshToken(payload);

    await this.usersService.updateUserToken(_id, refresh_token);
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRE')),
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id,
        email,
        name,
        role,
        permissions,
      },
    };
  }

  createRefreshToken(payload) {
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRE'),
    });
    return refreshToken;
  }

  async processRefreshToken(refreshToken: string, res: Response) {
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });

      const user = await this.usersService.findUserByToken(refreshToken);
      if (user) {
        const { _id, name, email, role } = user;
        const payload = {
          iss: 'from server',
          sub: 'token login',
          _id,
          name,
          email,
          role,
        };

        const access_token = this.jwtService.sign(payload);
        const refresh_token = this.createRefreshToken({
          ...payload,
          sub: 'token refresh',
        });

        const [, permissions] = await Promise.all([
          this.usersService.updateUserToken(_id.toString(), refresh_token),
          this.rolesService.findOne(
            (user.role as unknown as { _id: string; name: string })._id,
          ),
        ]);

        res.clearCookie('refresh_token');
        res.cookie('refresh_token', refresh_token, {
          httpOnly: true,
          maxAge: ms(
            this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRE'),
          ),
        });

        return {
          access_token,
          user: {
            _id,
            name,
            email,
            role,
            permissions: (permissions as any).permissions,
          },
        };
      }
    } catch (err) {
      throw new BadRequestException('Token không họp lệ hoặc hết hạn');
    }
  }

  async logout(user: IUser) {
    await this.usersService.updateUserToken(user._id, '');
    return 'ok';
  }
}
