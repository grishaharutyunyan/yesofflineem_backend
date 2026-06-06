import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../guards/jwt.guard';
import { EventsService } from '../../events/events.service';
import { CreateEventDto } from '../../events/dto/create-event.dto';
import { UpdateEventDto } from '../../events/dto/update-event.dto';
import { AdminEventsQueryDto } from './dto/admin-events-query.dto';
import {
  parseGetPaginationParams,
  getResponseForPagination,
} from '../../../orm/pagination/pagination';

@UseGuards(JwtGuard)
@Controller('events')
export class AdminEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async findAll(@Query() query: AdminEventsQueryDto) {
    const params = parseGetPaginationParams(query);
    if (query.status) params.filter = { ...params.filter, status: query.status };
    const result = await this.eventsService.paginate(params);
    return getResponseForPagination(result, params);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findById(id);
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