import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SESSION_TTL_MS = 10 * 60 * 1000;

interface Session {
  messages: ChatMessage[];
  timer: ReturnType<typeof setTimeout>;
}

@Injectable()
export class MemoryService implements OnModuleDestroy {
  private readonly sessions = new Map<string, Session>();

  createSession(): string {
    const id = randomUUID();
    const timer = setTimeout(() => this.clearSession(id), SESSION_TTL_MS);
    this.sessions.set(id, { messages: [], timer });
    return id;
  }

  getHistory(sessionId: string): ChatMessage[] {
    return this.sessions.get(sessionId)?.messages ?? [];
  }

  addMessage(sessionId: string, role: 'user' | 'assistant', content: string): void {
    if (!this.sessions.has(sessionId)) {
      const timer = setTimeout(() => this.clearSession(sessionId), SESSION_TTL_MS);
      this.sessions.set(sessionId, { messages: [], timer });
    }
    const session = this.sessions.get(sessionId)!;
    session.messages.push({ role, content });
    clearTimeout(session.timer);
    session.timer = setTimeout(() => this.clearSession(sessionId), SESSION_TTL_MS);
  }

  clearSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) clearTimeout(session.timer);
    this.sessions.delete(sessionId);
  }

  onModuleDestroy(): void {
    for (const id of this.sessions.keys()) {
      this.clearSession(id);
    }
  }
}