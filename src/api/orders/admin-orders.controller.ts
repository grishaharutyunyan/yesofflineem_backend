import {
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../admin/guards/jwt.guard';
import { OrdersService } from './orders.service';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto';
import {
  parseGetPaginationParams,
  getResponseForPagination,
} from '../../orm/pagination/pagination';

function applyFilters(params: any, query: AdminOrdersQueryDto) {
  const filter: Record<string, unknown> = { ...params.filter };
  if (query.status) filter.status = query.status;
  if (query.eventId) filter.eventId = Number(query.eventId);
  if (query.search) filter.search = query.search;
  params.filter = filter;
  return params;
}

function csvCell(v: unknown): string {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

@UseGuards(JwtGuard)
@Controller('orders')
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  async findAll(@Query() query: AdminOrdersQueryDto) {
    const params = applyFilters(parseGetPaginationParams(query), query);
    const result = await this.orders.paginate(params);
    return getResponseForPagination(result, params);
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="orders.csv"')
  async export(@Query() query: AdminOrdersQueryDto): Promise<string> {
    const params = applyFilters(parseGetPaginationParams(query), query);
    params.limit = 10000;
    params.offset = 0;
    const { items } = await this.orders.paginate(params);
    const header = [
      'orderNumber', 'status', 'event', 'firstName', 'lastName',
      'email', 'phone', 'guests', 'amount', 'currency', 'createdAt',
    ];
    const rows = items.map((o) =>
      [
        o.orderNumber, o.status, o.eventSlug, o.firstName, o.lastName,
        o.email, o.phone, o.guests, o.amount, o.currency, o.createdAt?.toISOString?.() ?? o.createdAt,
      ].map(csvCell).join(','),
    );
    return [header.map(csvCell).join(','), ...rows].join('\n');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orders.findById(id);
  }

  @Post(':id/refund')
  refund(@Param('id', ParseIntPipe) id: number) {
    return this.orders.refund(id);
  }

  @Post(':id/reverse')
  reverse(@Param('id', ParseIntPipe) id: number) {
    return this.orders.reverse(id);
  }
}
