import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../admin/guards/jwt.guard';
import { PromoCodesService } from './promo-codes.service';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from './dto/promo-code.dto';

@UseGuards(JwtGuard)
@Controller('promo-codes')
export class AdminPromoCodesController {
  constructor(private readonly promos: PromoCodesService) {}

  @Get()
  findAll() {
    return this.promos.findAll();
  }

  @Post()
  create(@Body() dto: CreatePromoCodeDto) {
    return this.promos.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePromoCodeDto) {
    return this.promos.setActive(id, dto.active);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.promos.remove(id);
  }
}