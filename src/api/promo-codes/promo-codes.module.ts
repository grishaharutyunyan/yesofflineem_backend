import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoCodeEntity } from './promo-code.entity';
import { PromoCodesService } from './promo-codes.service';

@Module({
  imports: [TypeOrmModule.forFeature([PromoCodeEntity])],
  providers: [PromoCodesService],
  exports: [PromoCodesService],
})
export class PromoCodesModule {}