import { Body, Controller, Post, HttpCode } from "@nestjs/common";
import { SubscribeService } from "./subscribe.service";

@Controller("subscribe")
export class SubscribeController {
  constructor(private readonly subscribeService: SubscribeService) {}

  @Post()
  @HttpCode(200)
  subscribe(@Body() body: { email: string }) {
    return this.subscribeService.subscribe(body.email);
  }
}
