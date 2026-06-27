import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
}
