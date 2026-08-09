import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string>; user?: unknown }>();
    const auth = req.headers['authorization'] ?? '';

    if (!auth.startsWith('Bearer ')) {
      throw new UnauthorizedException({ code: 'ACCESS_TOKEN_MISSING', message: 'Missing token' });
    }

    let payload: { sub: number; email: string; role: string };
    try {
      payload = this.jwtService.verify(auth.slice(7));
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException({ code: 'ACCESS_TOKEN_EXPIRED', message: 'Access token expired' });
      }
      throw new UnauthorizedException({ code: 'ACCESS_TOKEN_INVALID', message: 'Invalid token' });
    }

    if (payload.role !== 'admin') {
      throw new UnauthorizedException({ code: 'ACCESS_TOKEN_INVALID', message: 'Admin access required' });
    }

    req.user = payload;
    return true;
  }
}
