import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
  IsArray,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GuestDetailDto {
  @IsString()
  @MaxLength(60)
  firstName: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;

  @IsString()
  @MaxLength(40)
  phone: string;
}

export class CheckoutDto {
  @IsString()
  @MaxLength(200)
  slug: string;

  @IsInt()
  @Min(1)
  @Max(4)
  guests: number;

  @IsString()
  @MaxLength(60)
  firstName: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(40)
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => GuestDetailDto)
  guestDetails?: GuestDetailDto[];

  @IsIn(['en', 'hy'])
  locale: string;
}
