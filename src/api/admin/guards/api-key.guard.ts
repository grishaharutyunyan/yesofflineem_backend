import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const key = req.headers['x-admin-key'];
    const expected = this.config.get<string>('admin.apiKey');
    if (!expected) throw new UnauthorizedException('ADMIN_API_KEY not configured');
    if (key !== expected) throw new UnauthorizedException('Invalid admin key');
    return true;
  }
}