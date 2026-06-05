import { Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class SubscribeService {
  private readonly subscribers = new Set<string>();

  subscribe(email: string): { success: boolean; message: string } {
    if (!email || !email.includes("@")) {
      throw new BadRequestException("Invalid email address");
    }

    const normalized = email.toLowerCase().trim();

    if (this.subscribers.has(normalized)) {
      return { success: true, message: "Already subscribed" };
    }

    this.subscribers.add(normalized);
    console.log(`New subscriber: ${normalized} (total: ${this.subscribers.size})`);

    return { success: true, message: "Subscribed successfully" };
  }
}
