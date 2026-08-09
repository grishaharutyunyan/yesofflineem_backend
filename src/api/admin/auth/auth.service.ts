import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserEntity } from './user.entity';
import { RefreshTokenEntity } from './refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { REFRESH_TOKEN_TTL_MS } from './auth.constants';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: { id: number; email: string; role: string };
}

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function generateRawToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepo: Repository<RefreshTokenEntity>,
    private readonly jwtService: JwtService,
  ) {}

  private signAccessToken(user: Pick<UserEntity, 'id' | 'email' | 'role'>): string {
    return this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
  }

  private async issueRefreshToken(userId: number, familyId: string): Promise<string> {
    const raw = generateRawToken();
    const entity = this.refreshTokenRepo.create({
      tokenHash: hashToken(raw),
      familyId,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
    await this.refreshTokenRepo.save(entity);
    return raw;
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const familyId = crypto.randomUUID();
    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user.id, familyId);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async refresh(rawToken: string | undefined): Promise<AuthTokens> {
    if (!rawToken) {
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_MISSING', message: 'Missing refresh token' });
    }

    const tokenHash = hashToken(rawToken);
    const existing = await this.refreshTokenRepo.findOne({ where: { tokenHash } });

    if (!existing) {
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_INVALID', message: 'Invalid refresh token' });
    }

    if (existing.revoked) {
      // This token was already rotated away by an earlier refresh. Someone is
      // presenting a stale token — treat the whole session chain as compromised.
      await this.refreshTokenRepo.update({ familyId: existing.familyId }, { revoked: true });
      this.logger.warn(
        `Refresh token reuse detected for userId=${existing.userId} familyId=${existing.familyId} — session family revoked`,
      );
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_REUSED', message: 'Refresh token reuse detected' });
    }

    if (existing.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_EXPIRED', message: 'Refresh token expired' });
    }

    const user = await this.userRepo.findOne({ where: { id: existing.userId } });
    if (!user) {
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_INVALID', message: 'User not found' });
    }

    existing.revoked = true;
    await this.refreshTokenRepo.save(existing);

    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user.id, existing.familyId);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const tokenHash = hashToken(rawToken);
    await this.refreshTokenRepo.update({ tokenHash }, { revoked: true });
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.save(user);
  }
}
