import { LocaleText } from '../../events/event-i18n.types';

export class CreateVideoDto {
  title: LocaleText;
  subtitle: LocaleText;
  url: string;
  thumbnailUrl?: string | null;
  priority?: number;
}