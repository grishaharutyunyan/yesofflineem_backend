import { CreateVideoDto } from './dto/create-video.dto';

export const SEED_VIDEOS: CreateVideoDto[] = [
  {
    title: { en: 'A Day in the Forest', hy: 'Մի օր անտառում' },
    subtitle: {
      en: 'Follow the Dilijan retreat from arrival to farewell fire.',
      hy: 'Հետևեք Դիլիջանի ռետրիտին ժամանումից մինչև հրաժեշտի խարույկ։',
    },
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: null,
    priority: 1,
  },
  {
    title: { en: 'Sunrise Over Hrazdan', hy: 'Արևածագ Հրազդանի վրա' },
    subtitle: {
      en: 'A short film of our morning run series through the gorge.',
      hy: 'Կարճ ֆիլմ կիրճով մեր առավոտյան վազքի մասին։',
    },
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: null,
    priority: 2,
  },
  {
    title: { en: 'What is yesoffline?', hy: 'Ի՞նչ է yesoffline-ը' },
    subtitle: {
      en: 'Ani explains the idea behind the gatherings in under two minutes.',
      hy: 'Անին բացատրում է հավաքույթների գաղափարը երկու րոպեից կարճ ժամանակում։',
    },
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: null,
    priority: 3,
  },
];