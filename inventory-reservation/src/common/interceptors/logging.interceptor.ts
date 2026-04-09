import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const requestId = uuid();
    const { method, url } = req;
    const start = Date.now();

    res.setHeader('X-Request-Id', requestId);

    this.logger.log(`[${requestId}] → ${method} ${url}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(
            `[${requestId}] ← ${method} ${url} ${res.statusCode} (${ms}ms)`,
          );
        },
        error: (err) => {
          const ms = Date.now() - start;
          this.logger.warn(
            `[${requestId}] ← ${method} ${url} ${err?.status ?? 500} (${ms}ms) — ${err?.message}`,
          );
        },
      }),
    );
  }
}
