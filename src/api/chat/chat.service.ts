import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import { MemoryService } from './memory/memory.service';
import { PromptService } from './prompt.service';
import { EventStatus } from '../../constants/enums/event.enums';
import { eventSummaryForLang } from '../events/event-summary';
import { EventsService } from '../events/events.service';
import { agentTools, handleGetEvents } from './tools/agent.tools';

export interface EventCard {
  slug: string;
  title: string;
  label: string;
  date: string;
  location: string;
  price: string;
  spotsLeft: number;
  shortDescription: string;
  includes: string[];
  host: string;
  hostRole: string;
}

export interface ChatResponse {
  reply: string;
  session_id: string;
  action?: 'book';
  slug?: string;
  eventCard?: EventCard;
  eventCards?: EventCard[];
}

@Injectable()
export class ChatService {
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(
    private readonly config: ConfigService,
    private readonly memory: MemoryService,
    private readonly prompt: PromptService,
    private readonly events: EventsService,
  ) {
    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: config.get<string>('openRouter.apiKey'),
    });
    this.model = config.get<string>('openRouter.model');
  }

  createSession(): string {
    return this.memory.createSession();
  }

  async chat(message: string, sessionId?: string, lang?: 'en' | 'hy' | 'ru'): Promise<ChatResponse> {
    const sid = sessionId ?? randomUUID();
    const allEvents = await this.events.findAll(EventStatus.ACTIVE);
    const systemPrompt = this.prompt.build(allEvents, lang);

    this.memory.addMessage(sid, 'user', message);
    const history = this.memory.getHistory(sid);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    try {
      const first = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        tools: agentTools as OpenAI.Chat.Completions.ChatCompletionTool[],
        tool_choice: 'auto',
        max_tokens: 400,
      });

      const choice = first.choices[0];
      let finalReply = '';
      let bookingSlug: string | undefined;
      let bookingCard: EventCard | undefined;
      let allEventCards: EventCard[] | undefined;

      if (choice.message.tool_calls?.length) {
        const toolMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          ...messages,
          choice.message as OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam,
        ];

        for (const tc of choice.message.tool_calls) {
          if (tc.type !== 'function') continue;
          const args = JSON.parse(tc.function.arguments || '{}') as Record<string, string>;
          let result = '';

          if (tc.function.name === 'list_all_events') {
            allEventCards = allEvents.map((event) => {
              const s = eventSummaryForLang(event, lang ?? 'en');
              return {
                slug: s.slug,
                title: s.title,
                label: s.label,
                date: s.dateLong,
                location: s.locationFull,
                price: s.priceLabel,
                spotsLeft: s.spotsLeft,
                shortDescription: s.shortDescription,
                includes: s.includes,
                host: s.host,
                hostRole: s.hostRole,
              };
            });
            result = `Showing all ${allEventCards.length} upcoming gatherings as visual cards.`;
          } else if (tc.function.name === 'get_events') {
            const monthArg = args.month ? parseInt(args.month, 10) : undefined;
            result = handleGetEvents(allEvents.map((e) => eventSummaryForLang(e, lang ?? 'en')), args.filter, monthArg);
          } else if (tc.function.name === 'suggest_booking') {
            bookingSlug = args.slug;
            const event = allEvents.find((e) => e.slug === args.slug);
            if (event) {
              const s = eventSummaryForLang(event, lang ?? 'en');
              bookingCard = {
                slug: s.slug,
                title: s.title,
                label: s.label,
                date: s.dateLong,
                location: s.locationFull,
                price: s.priceLabel,
                spotsLeft: s.spotsLeft,
                shortDescription: s.shortDescription,
                includes: s.includes,
                host: s.host,
                hostRole: s.hostRole,
              };
            }
            result = `Booking button shown for: ${args.event_name}. Now write a warm, 3-sentence description of the experience using the event's long description as the source.`;
          }

          toolMessages.push({ role: 'tool', tool_call_id: tc.id, content: result });
        }

        const second = await this.openai.chat.completions.create({
          model: this.model,
          messages: toolMessages,
          max_tokens: 400,
        });

        finalReply = second.choices[0].message.content ?? '';
      } else {
        finalReply = choice.message.content ?? '';
      }

      this.memory.addMessage(sid, 'assistant', finalReply);

      return {
        reply: finalReply,
        session_id: sid,
        ...(bookingSlug ? { action: 'book', slug: bookingSlug } : {}),
        ...(bookingCard ? { eventCard: bookingCard } : {}),
        ...(allEventCards ? { eventCards: allEventCards } : {}),
      };
    } catch (err) {
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'OpenRouter request failed',
      );
    }
  }

  clearSession(sessionId: string): void {
    this.memory.clearSession(sessionId);
  }
}
