import { Injectable } from "@nestjs/common";

export interface CommunityPost {
  id: number;
  author: string;
  location: string;
  content: string;
  emoji: string;
  createdAt: string;
}

@Injectable()
export class CommunityService {
  private readonly posts: CommunityPost[] = [
    {
      id: 1,
      author: "Sara M.",
      location: "Amsterdam",
      content:
        "Did a 2-hour phone-free Sunday walk this morning. Remembered what birds sound like.",
      emoji: "🌿",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      author: "James K.",
      location: "Portland",
      content:
        "Week 3 of no social media before 10am. My mornings feel like they belong to me again.",
      emoji: "☀️",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      author: "Lena V.",
      location: "Berlin",
      content:
        "Our book club finished Braiding Sweetgrass tonight. We talked for 4 hours over soup. No one checked their phone.",
      emoji: "📚",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      author: "Marco D.",
      location: "Rome",
      content:
        "Started cooking dinner from scratch every evening. Turns out it takes 45 minutes and feels like meditation.",
      emoji: "🍲",
      createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 5,
      author: "Priya S.",
      location: "London",
      content:
        "Joined the Saturday morning walk group. Six strangers, two hours, zero notifications.",
      emoji: "🚶",
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
  ];

  findAll(): CommunityPost[] {
    return this.posts;
  }
}
