import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import type { LocaleText } from '../../events/event-i18n.types';

export class UpdateVideoDto {
  @IsOptional() @IsObject()
  title?: LocaleText;

  @IsOptional() @IsObject()
  subtitle?: LocaleText;

  @IsOptional() @IsString()
  url?: string;

  @IsOptional() @IsNumber()
  priority?: number;
}