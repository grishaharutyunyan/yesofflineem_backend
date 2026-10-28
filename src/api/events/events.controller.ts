import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { EventStatus } from '../../constants/enums/event.enums';
import { EventsService } from './events.service';
import { PromoCodesService } from '../promo-codes/promo-codes.service';
import { PaginationOptionsDto } from '../../orm/pagination/dto/pagination-options.dto';
import {
  parseGetPaginationParams,
  getResponseForPagination,
} from '../../orm/pagination/pagination';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly promos: PromoCodesService,
  ) {}

  @Get()
  async findAll(
    @Query() paginationOptions: PaginationOptionsDto,
    @Query('status', new ParseEnumPipe(EventStatus, { optional: true }))
    status?: EventStatus,
  ) {
    const params = parseGetPaginationParams(paginationOptions);
    if (status) {
      params.filter = { ...params.filter, status };
    }
    const result = await this.eventsService.paginate(params);
    return getResponseForPagination(result, params);
  }

  @Get('upcoming')
  findUpcoming(
    @Query('limit', new DefaultValuePipe(3), ParseIntPipe) limit: number,
  ) {
    return this.eventsService.findUpcoming(limit);
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const ev = await this.eventsService.findBySlug(slug);
    return { ...ev, promoAvailable: ev.price > 0 && ev.promoEnabled && (await this.promos.hasUsable(ev.id)) };
  }
}
