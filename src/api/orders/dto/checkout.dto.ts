import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';

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

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsIn(['en', 'hy'])
  locale: string;
}
