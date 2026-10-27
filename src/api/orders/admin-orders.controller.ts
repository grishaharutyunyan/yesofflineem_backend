import {
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
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

  @Get('export-pdf')
  async exportPdf(@Query() query: AdminOrdersQueryDto, @Res() res: Response) {
    const pdf = await this.orders.ordersPdf(applyFilters(parseGetPaginationParams(query), query));
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.pdf"`,
      'Content-Length': String(pdf.length),
    });
    res.end(pdf);
  }

  @Get('participants-pdf')
  async participantsPdf(@Query('eventId', ParseIntPipe) eventId: number, @Res() res: Response) {
    const { pdf, slug } = await this.orders.participantsPdf(eventId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="participants-${slug.replace(/[^a-z0-9-]/gi, '')}.pdf"`,
      'Content-Length': String(pdf.length),
    });
    res.end(pdf);
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
