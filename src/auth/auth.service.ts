import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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

  async login(user: any) {
    const payload = { username: user.email, sub: user._id };
    return { access_token: this.jwtService.sign(payload) };
  }
}
