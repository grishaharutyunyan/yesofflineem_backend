import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { EventsModule } from '../events/events.module';
import { VideosModule } from '../videos/videos.module';
import { AuthModule } from './auth/auth.module';
import { JwtGuard } from './guards/jwt.guard';
import { UploadController } from './upload/upload.controller';
import { AdminEventsController } from './events/admin-events.controller';
import { AdminVideosController } from './videos/admin-videos.controller';

@Module({
  imports: [
    MulterModule.register({}),
    EventsModule,
    VideosModule,
    AuthModule,
  ],
  controllers: [UploadController, AdminEventsController, AdminVideosController],
  providers: [JwtGuard],
})
export class AdminModule {}
