import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/decorators/customize';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();
    if (err || !user) {
      throw err || new UnauthorizedException('Token không hợp lệ');
    }
    const permissions = user?.permissions ?? [];
    const targetMethod = request.method;
    const targetEndpoint = request.route?.path as string;

    let isExist = permissions.find((permission) => {
      return (
        permission.apiPath === targetEndpoint &&
        permission.method === targetMethod
      );
    });

    if (targetEndpoint.startsWith('/api/v1/auth')) isExist = true;

    if (!isExist) {
      throw new ForbiddenException(
        'Bạn không có quyền để truy cập endpoint này',
      );
    }

    return user;
  }
}
