import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import type { LocaleText } from '../../events/event-i18n.types';

export class CreateVideoDto {
  @IsObject()
  title: LocaleText;

  @IsObject()
  subtitle: LocaleText;

  @IsString()
  url: string;

  @IsOptional() @IsString()
  thumbnailUrl?: string | null;

  @IsOptional() @IsNumber()
  priority?: number;
}