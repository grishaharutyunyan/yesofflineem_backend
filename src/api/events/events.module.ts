import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventEntity } from './event.entity';
import { PromoCodesModule } from '../promo-codes/promo-codes.module';

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity]), PromoCodesModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
