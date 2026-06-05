import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CommunityModule } from './community/community.module';
import { EventsModule } from './events/events.module';
import { SubscribeModule } from './subscribe/subscribe.module';
import { ChatModule } from './chat/chat.module';
import { VideosModule } from './videos/videos.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './admin/auth/auth.module';
import { ContactModule } from './contact/contact.module';

const publicModules = [
  CommunityModule,
  EventsModule,
  SubscribeModule,
  ChatModule,
  VideosModule,
  AuthModule,
  ContactModule,
];

@Module({
  imports: [
    RouterModule.register([
      {
        path: 'api',
        children: [
          ...publicModules.map((m) => ({ path: '/', module: m })),
          { path: '/admin', module: AdminModule },
        ],
      },
    ]),
    ...publicModules,
    AdminModule,
  ],
  exports: [...publicModules, AdminModule],
})
export class ApiModule {}
