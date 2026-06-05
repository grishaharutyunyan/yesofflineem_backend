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
import { VideosService } from '../../videos/videos.service';
import { CreateVideoDto } from '../../videos/dto/create-video.dto';
import { UpdateVideoDto } from '../../videos/dto/update-video.dto';
import { PaginationOptionsDto } from '../../../orm/pagination/dto/pagination-options.dto';
import {
  parseGetPaginationParams,
  getResponseForPagination,
} from '../../../orm/pagination/pagination';

@UseGuards(JwtGuard)
@Controller('videos')
export class AdminVideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get()
  async findAll(@Query() paginationOptions: PaginationOptionsDto) {
    const params = parseGetPaginationParams(paginationOptions);
    const result = await this.videosService.paginate(params);
    return getResponseForPagination(result, params);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.videosService.findById(id);
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