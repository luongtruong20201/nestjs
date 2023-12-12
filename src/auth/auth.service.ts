import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/users/users.interface';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string) {
    const user = await this.usersService.findOneByEmail(username);
    if (user && user.password) {
      const isMatch = this.usersService.matchPassword(pass, user.password);
      if (isMatch === true) {
        return user;
      }
    }
    return null;
  }

  async login(user: IUser) {
    const { _id, email, name, role } = user;
    const payload = {
      sub: 'token login',
      iss: 'from server',
      _id,
      email,
      name,
      role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      _id,
      email,
      name,
      role,
    };
  }
}
