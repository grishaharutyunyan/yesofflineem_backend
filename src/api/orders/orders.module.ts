import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './order.entity';
import { EventEntity } from '../events/event.entity';
import { OrdersService } from './orders.service';
import { EpgService } from './epg.service';
import { OrdersMailService } from './orders-mail.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, EventEntity])],
  controllers: [PaymentsController],
  providers: [OrdersService, EpgService, OrdersMailService],
  exports: [OrdersService],
})
export class OrdersModule {}
