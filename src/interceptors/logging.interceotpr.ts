import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { ip, method, url } = request;

    this.logRequest(ip, method, url);
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logResponse(ip, method, url, startTime);
      }),
    );
  }

  private logRequest(ip: string, method: string, url: string) {
    this.logger.log(`Request from ${ip} to ${method} ${url}`);
  }

  private logResponse(
    ip: string,
    method: string,
    url: string,
    startTime: number,
  ) {
    const elapsedTime = Date.now() - startTime;
    this.logger.log(
      `Response to ${method} ${url} from ${ip} in ${elapsedTime}ms`,
    );
  }
}
