import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string>; user?: unknown }>();
    const auth = req.headers['authorization'] ?? '';

    if (!auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token');
    }

    let payload: { sub: number; email: string; role: string };
    try {
      payload = this.jwtService.verify(auth.slice(7));
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    req.user = payload;
    return true;
  }
}
