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
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { PaginationOptionsDto } from '../../orm/pagination/dto/pagination-options.dto';
import {
  parseGetPaginationParams,
  getResponseForPagination,
} from '../../orm/pagination/pagination';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get()
  async findAll(@Query() paginationOptions: PaginationOptionsDto) {
    const params = parseGetPaginationParams(paginationOptions);
    const result = await this.videosService.paginate(params);
    return getResponseForPagination(result, params);
  }

  @Post()
  create(@Body() dto: CreateVideoDto) {
    return this.videosService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVideoDto) {
    return this.videosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.videosService.remove(id);
  }
}