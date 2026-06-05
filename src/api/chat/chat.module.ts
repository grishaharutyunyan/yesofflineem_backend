import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PromptService } from './prompt.service';
import { MemoryService } from './memory/memory.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [ChatController],
  providers: [ChatService, PromptService, MemoryService],
})
export class ChatModule {}
