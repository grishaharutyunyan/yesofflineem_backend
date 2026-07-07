import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { EventsModule } from '../events/events.module';
import { VideosModule } from '../videos/videos.module';
import { ContactModule } from '../contact/contact.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { JwtGuard } from './guards/jwt.guard';
import { UploadController } from './upload/upload.controller';
import { AdminEventsController } from './events/admin-events.controller';
import { AdminVideosController } from './videos/admin-videos.controller';
import { AdminContactsController } from './contacts/admin-contacts.controller';
import { AdminOrdersController } from '../orders/admin-orders.controller';

@Module({
  imports: [
    MulterModule.register({}),
    EventsModule,
    VideosModule,
    ContactModule,
    AuthModule,
    OrdersModule,
  ],
  controllers: [UploadController, AdminEventsController, AdminVideosController, AdminContactsController, AdminOrdersController],
  providers: [JwtGuard],
})
export class AdminModule {}
