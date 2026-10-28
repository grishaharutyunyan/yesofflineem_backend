import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export const PROMO_CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;

const upper = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);

export class CreatePromoCodeDto {
  @Transform(upper)
  @IsString()
  @Matches(PROMO_CODE_PATTERN, { message: 'code must be 3-32 chars: A-Z, 0-9, _ or -' })
  code: string;

  @IsOptional()
  @IsInt()
  eventId?: number | null;

  @IsInt()
  @Min(1)
  @Max(100)
  discountPercent: number;

  @IsOptional()
  @IsBoolean()
  singleGuest?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number | null;

  @IsOptional()
  @IsDateString()
  validFrom?: string | null;

  @IsOptional()
  @IsDateString()
  validUntil?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdatePromoCodeDto {
  @IsBoolean()
  active: boolean;
}

export class CheckPromoCodeDto {
  @IsString()
  slug: string;

  @Transform(upper)
  @IsString()
  @Matches(PROMO_CODE_PATTERN)
  code: string;
}