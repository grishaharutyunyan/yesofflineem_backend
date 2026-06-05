import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { EventStatus } from '../../constants/enums/event.enums';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PaginationOptionsDto } from '../../orm/pagination/dto/pagination-options.dto';
import {
  parseGetPaginationParams,
  getResponseForPagination,
} from '../../orm/pagination/pagination';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

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
  findOne(@Param('slug') slug: string) {
    return this.eventsService.findBySlug(slug);
  }

  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.remove(id);
  }
}