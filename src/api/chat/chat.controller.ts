import { Body, Controller, Delete, HttpCode, Param, Post } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('session')
  @HttpCode(201)
  createSession() {
    return { session_id: this.chatService.createSession() };
  }

  @Post()
  @HttpCode(200)
  chat(@Body() body: { message: string; session_id?: string; lang?: 'en' | 'hy' | 'ru' }) {
    return this.chatService.chat(body.message, body.session_id, body.lang);
  }

  @Delete(':sessionId')
  @HttpCode(204)
  clearSession(@Param('sessionId') sessionId: string) {
    this.chatService.clearSession(sessionId);
  }
}
