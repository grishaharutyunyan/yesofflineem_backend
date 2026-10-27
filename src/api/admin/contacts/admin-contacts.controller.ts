import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../guards/jwt.guard';
import { ContactService } from '../../contact/contact.service';

@UseGuards(JwtGuard)
@Controller('contacts')
export class AdminContactsController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  findAll(@Query('source') source?: string) {
    return this.contactService.findAll(source);
  }

  @Get('unread-count')
  unreadCount() {
    return this.contactService.unreadCounts();
  }

  @Post('read-all')
  async markAllRead(@Query('source') source?: string) {
    await this.contactService.markAllRead(source);
    return { ok: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contactService.remove(id);
  }

  @Patch(':id/read')
  async setRead(@Param('id', ParseIntPipe) id: number, @Body('read') read?: boolean) {
    await this.contactService.setRead(id, read !== false);
    return { ok: true };
  }
}
