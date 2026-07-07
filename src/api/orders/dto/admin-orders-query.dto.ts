import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationOptionsDto } from '../../../orm/pagination/dto/pagination-options.dto';
import { OrderStatus } from '../../../constants/enums/order.enums';

export class AdminOrdersQueryDto extends PaginationOptionsDto {
  @IsOptional()
  @IsIn(Object.values(OrderStatus))
  readonly status?: OrderStatus;

  @IsOptional()
  @IsString()
  readonly eventId?: string;

  @IsOptional()
  @IsString()
  readonly search?: string;
}
