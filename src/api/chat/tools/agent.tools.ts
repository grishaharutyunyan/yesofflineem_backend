import type { EventSummary } from '../../events/event-summary';

export const agentTools = [
  {
    type: 'function' as const,
    function: {
      name: 'list_all_events',
      description:
        'Show all upcoming yesofflineem gatherings as visual cards to the user. Call this whenever the user asks what events are coming up, wants to see all gatherings, or asks for suggestions.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_events',
      description:
        'Get upcoming yesofflineem gatherings. Use this when the user asks about events in a specific month, city, or type. Pass `month` (1–12) to filter by month, and/or `filter` for keyword filtering.',
      parameters: {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            description: 'Keyword to filter events by title, city, or location',
          },
          month: {
            type: 'number',
            description: 'Month number (1=January … 12=December) to filter events by start date',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'suggest_booking',
      description:
        'Show the user a booking button for a specific event. Call this when the user is clearly interested in attending.',
      parameters: {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            description: 'URL slug of the event, e.g. "saturday-morning-walk"',
          },
          event_name: {
            type: 'string',
            description: 'Display name of the event',
          },
        },
        required: ['slug', 'event_name'],
      },
    },
  },
];

export function handleGetEvents(events: EventSummary[], filter?: string, month?: number): string {
  let list = events;
  if (month) {
    list = list.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === month;
    });
  }
  if (filter) {
    const q = filter.toLowerCase();
    list = list.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.locationFull.toLowerCase().includes(q),
    );
  }
  if (!list.length) return 'No matching events found for that time or filter.';
  return list
    .map(
      (e) =>
        `${e.title} (slug: ${e.slug}) — ${e.dateLong}, ${e.locationFull} · ${e.priceLabel} · ${e.spotsLeft} spots left\n  ${e.shortDescription}`,
    )
    .join('\n\n');
}
