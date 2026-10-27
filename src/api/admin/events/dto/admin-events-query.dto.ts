import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { PaginationOptionsDto } from '../../../../orm/pagination/dto/pagination-options.dto';
import { EventStatus } from '../../../../constants/enums/event.enums';

export class AdminEventsQueryDto extends PaginationOptionsDto {
  @IsOptional()
  @IsEnum(EventStatus)
  readonly status?: EventStatus;

  @IsOptional()
  @IsIn(['upcoming', 'past'])
  readonly when?: 'upcoming' | 'past';
}