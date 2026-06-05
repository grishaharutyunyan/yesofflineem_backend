import { EventStatus } from '../../constants/enums/event.enums';
import { CreateEventDto } from './dto/create-event.dto';

/** Seed events in the native EventEntity shape ({ en, hy } JSON fields). */
export const SEED_EVENTS: CreateEventDto[] = [
  {
    slug: 'forest-retreat-june',
    status: EventStatus.ACTIVE,
    label: { en: 'Forest Retreat', hy: 'Անտառային Ռետրիտ' },
    title: {
      en: 'Forest Retreat in Dilijan',
      hy: 'Անտառային ռետրիտ Դիլիջանում',
    },
    dates: { start: '2026-06-14 18:00', end: '2026-06-16 15:00' },
    location: { en: 'Dilijan, Armenia', hy: 'Դիլիջան, Հայաստան' },
    locationDetail: {
      en: 'Hiekerhoes Estate, Dilijan National Park, Armenia',
      hy: 'Հայկերհուս կալվածք, Դիլիջանի ազգային պարկ, Հայաստան',
    },
    shortDescription: {
      en: 'Three days of intentional slowness in the heart of the Armenian forest. Morning yoga, foraging walks, fire-side reflections, plant-based meals.',
      hy: 'Երեք օր գիտակցված անդորր հայկական անտառի սրտում։ Առավոտյան յոգա, վայրի բույսերի հավաքում, զրույցներ խարույկի շուրջ և բուսական սնունդ։',
    },
    longDescription: {
      en: 'Set in a private estate surrounded by the ancient pine and oak forest of Dilijan, this retreat is designed to strip away the noise of daily life. You will wake to birdsong, practise yoga on a wooden deck overlooking the valley, forage for wild herbs with a local guide, and gather around a fire each evening for reflection and honest conversation.<PARA>All meals are plant-based, locally sourced, and prepared with care by our in-house cook. No schedules, no performance — just permission to be.',
      hy: 'Այս ռետրիտը կազմակերպվում է Դիլիջանի հնամենի սոճիների և կաղնիների անտառով շրջապատված մասնավոր կալվածքում և նպատակ ունի հեռացնելու ձեզ առօրյա կյանքի աղմուկից։ Դուք կարթնանաք թռչունների դայլայլի ներքո, յոգայով կզբաղվեք հովտին նայող փայտե հարթակի վրա, տեղացի ուղեկցորդի հետ կհավաքեք վայրի խոտաբույսեր, իսկ երեկոյան կհավաքվեք խարույկի շուրջ՝ անկեղծ զրույցների և խոհերի համար։<PARA>Բոլոր կերակուրները բուսական են, պատրաստված տեղական թարմ մթերքներից մեր խոհարարի կողմից։ Չկան ժամանակացույցեր, չկան պարտադրանքներ՝ միայն լիակատար ազատություն լինելու ինքներդ ձեզ հետ։',
    },
    includes: {
      en: [
        'Morning yoga & breathwork',
        'Forest foraging walk',
        'Fireside reflection evenings',
        'All plant-based meals',
        'Private accommodation',
        'Welcome & closing ceremony',
      ],
      hy: [
        'Առավոտյան յոգա և շնչառական պրակտիկա',
        'Անտառային զբոսանք և վայրի բույսերի հավաքում',
        'Երեկոյան զրույցներ խարույկի շուրջ',
        'Ամբողջությամբ բուսական սնունդ',
        'Մասնավոր կացարան',
        'Բացման և փակման արարողություններ',
      ],
    },
    schedule: [
      {
        time: 'Day 1',
        label: { en: 'Arrival & settling in', hy: 'Ժամանում և տեղավորում' },
        sub: {
          en: 'Evening welcome circle, shared dinner',
          hy: 'Երեկոյան ողջույնի շրջան, ընթրիք միասին',
        },
      },
      {
        time: 'Day 2',
        label: { en: 'Deep immersion day', hy: 'Խորը ընկղմման օր' },
        sub: {
          en: 'Yoga · Foraging · Solo silence · Fire ritual',
          hy: 'Յոգա · Բույսերի հավաքում · Մենություն և լռություն · Խարույկի ծիսակարգ',
        },
      },
      {
        time: 'Day 3',
        label: { en: 'Integration & closing', hy: 'Ամփոփում և փակում' },
        sub: {
          en: 'Morning practice · Farewell breakfast · Departure',
          hy: 'Առավոտյան պրակտիկա · Հրաժեշտի նախաճաշ · Մեկնում',
        },
      },
    ],
    host: {
      name: { en: 'Ani Nazaryan', hy: 'Անի Նազարյան' },
      role: {
        en: 'Founder & Lead Facilitator',
        hy: 'Հիմնադիր և գլխավոր համակարգող',
      },
      imageUrl: null,
    },
    coordinates: {
      lat: 40.7414,
      lng: 44.8631,
      address: {
        en: 'Dilijan National Park, Tavush Province, Dilijan, Armenia 3903',
        hy: 'Դիլիջանի ազգային պարկ, Տավուշի մարզ, Դիլիջան, Հայաստան 3903',
      },
    },
    maxCapacity: 14,
    bookedCount: 10,
    price: 65000,
    cardImageUrl:
        'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    galleryImageUrls: [
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    slug: 'sunrise-run-june',
    status: EventStatus.ACTIVE,
    label: { en: 'Sunrise Run', hy: 'Վազք Արշալույսին' },
    title: {
      en: 'Sunrise Run · Hrazdan Gorge',
      hy: 'Վազք արշալույսին · Հրազդանի կիրճ',
    },
    dates: { start: '2026-06-21 05:45', end: '2026-06-21 08:30' },
    location: { en: 'Hrazdan Gorge, Yerevan', hy: 'Հրազդանի կիրճ, Երևան' },
    locationDetail: {
      en: 'Meeting point: bridge at Hrazdan Gorge entrance',
      hy: 'Հանդիպման վայրը՝ Հրազդանի կիրճի մուտքի մոտի կամուրջը',
    },
    shortDescription: {
      en: 'A gentle 5km morning run through the gorge at sunrise, followed by stretching and a plant-based breakfast together.',
      hy: 'Թեթև 5 կմ առավոտյան վազք կիրճով արշալույսին, որին կհաջորդեն մարմնի ձգման վարժություններ և համատեղ բուսական նախաճաշ։',
    },
    longDescription: {
      en: 'We meet just before sunrise at the gorge bridge. A warm-up, a few intentions, then a 5km loop along the river path as the sun comes up over the cliffs. All paces welcome — this is not a race.<PARA>After the run we stretch together on the grass, then walk to a quiet café for a slow breakfast and conversation.',
      hy: 'Մենք հանդիպում ենք կիրճի կամրջի մոտ՝ արշալույսից անմիջապես առաջ։ Նախավարժանք, նպատակների սահմանում, ապա 5 կմ վազք գետի երկայնքով, երբ արևը բարձրանում է ժայռերի վերևում։ Բոլոր տեմպերը ընդունելի են. սա մրցավազք չէ։<PARA>Վազքից հետո մենք միասին ձգումներ կանենք խոտերի վրա, այնուհետև կքայլենք դեպի հանգիստ սրճարան՝ հանգիստ նախաճաշի և զրույցի համար։',
    },
    includes: {
      en: [
        'Group warm-up and stretch',
        '5km loop at gentle pace',
        'Trained guide and tail runner',
        'Plant-based breakfast after',
        'Reusable water bottle',
        'Group photo from the morning',
      ],
      hy: [
        'Խմբակային նախավարժանք և ձգումներ',
        '5 կմ վազք հանգիստ տեմպով',
        'Փորձառու ուղեկցորդ և աջակցող վազորդ',
        'Բուսական նախաճաշ վազքից հետո',
        'Բազմակի օգտագործման ջրի շիշ',
        'Առավոտյան խմբակային լուսանկար',
      ],
    },
    schedule: [
      {
        time: '05:45',
        label: {
          en: 'Meeting point & warm-up',
          hy: 'Հանդիպման վայր և նախավարժանք',
        },
        sub: { en: 'Bridge at gorge entrance', hy: 'Կամուրջ կիրճի մուտքի մոտ' },
      },
      {
        time: '06:15',
        label: { en: 'Sunrise run', hy: 'Վազք արշալույսին' },
        sub: {
          en: '5km gentle loop, all paces welcome',
          hy: '5 կմ հանգիստ վազք, բոլոր տեմպերը ընդունելի են',
        },
      },
      {
        time: '07:00',
        label: { en: 'Cool-down stretch', hy: 'Մարմնի ձգում և հանգստացում' },
        sub: {
          en: 'On the grass overlooking river',
          hy: 'Խոտերի վրա՝ դեպի գետը նայող տեսարանով',
        },
      },
      {
        time: '07:30',
        label: {
          en: 'Slow breakfast together',
          hy: 'Հանգիստ համատեղ նախաճաշ',
        },
        sub: { en: 'Plant-based menu, no rush', hy: 'Բուսական մենյու, առանց շտապելու' },
      },
    ],
    host: {
      name: { en: 'Varduhi Karapetyan', hy: 'Վարդուհի Կարապետյան' },
      role: { en: 'Wellness Guide', hy: 'Առողջ ապրելակերպի ուղեկցորդ' },
      imageUrl: null,
    },
    coordinates: {
      lat: 40.1872,
      lng: 44.5152,
      address: {
        en: 'Hrazdan Gorge entrance bridge, Kentron, Yerevan 0001',
        hy: 'Հրազդանի կիրճի մուտքի կամուրջ, Կենտրոն, Երևան 0001',
      },
    },
    maxCapacity: 18,
    bookedCount: 9,
    price: 5500,
    cardImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
    galleryImageUrls: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    slug: 'slow-sunday-breakfast',
    status: EventStatus.ACTIVE,
    label: { en: 'Breakfast Circle', hy: 'Նախաճաշի Շրջան' },
    title: {
      en: 'Slow Sunday Breakfast',
      hy: 'Հանգիստ Կիրակնօրյա Նախաճաշ',
    },
    dates: { start: '2026-06-29 09:00', end: '2026-06-29 11:30' },
    location: { en: 'Yerevan, Cascade area', hy: 'Երևան, Կասկադի տարածք' },
    locationDetail: {
      en: 'The Long Table at Cascade, Yerevan',
      hy: 'Երկար սեղան Կասկադում, Երևան',
    },
    shortDescription: {
      en: 'A long table, seasonal produce, warm drinks, guided journaling, and an intention for the week ahead.',
      hy: 'Երկար սեղան, սեզոնային մթերքներ, տաք ըմպելիքներ, օրագիր վարելու ուղղորդված պրակտիկա և գալիք շաբաթվա նպատակների սահմանում։',
    },
    longDescription: {
      en: 'The Slow Sunday Breakfast is our most intimate format. Twelve people. One long table. Two hours of genuine conversation, carefully prepared food, and space to reflect.<PARA>Ani leads a short guided journaling exercise at the midpoint — nothing intense, just a few prompts to help you arrive into the week with intention rather than inertia.',
      hy: 'Հանգիստ Կիրակնօրյա Նախաճաշը մեր ամենամտերիմ ձևաչափն է։ Տասներկու հոգի։ Մեկ երկար սեղան։ Երկու ժամ անկեղծ զրույց, խնամքով պատրաստված սնունդ և տարածություն խոհերի համար։<PARA>Անին հանդիպման կեսին կվարի օրագիր պահելու կարճ ուղղորդված վարժություն. ոչ մի բարդ բան, պարզապես մի քանի հուշում, որոնք կօգնեն ձեզ մուտք գործել նոր շաբաթ գիտակցված նպատակներով, այլ ոչ թե իներցիայով։',
    },
    includes: {
      en: [
        'Seasonal plant-based breakfast',
        'Specialty coffee & herbal teas',
        'Guided journaling exercise',
        'Intention-setting practice',
        'Community connection',
        'Take-home journaling card',
      ],
      hy: [
        'Սեզոնային բուսական նախաճաշ',
        'Բարձրորակ սուրճ և խոտաբուսային թեյեր',
        'Օրագիր վարելու ուղղորդված վարժություն',
        'Նպատակների սահմանման պրակտիկա',
        'Համայնքային կապեր',
        'Տուն տանելու օրագրային քարտ',
      ],
    },
    schedule: [
      {
        time: '09:00',
        label: {
          en: 'Arrival & warm welcome',
          hy: 'Ժամանում և ջերմ ողջույն',
        },
        sub: {
          en: 'Find your seat, settle in',
          hy: 'Գտեք ձեր տեղը, տեղավորվեք',
        },
      },
      {
        time: '09:20',
        label: { en: 'Shared breakfast', hy: 'Համատեղ նախաճաշ' },
        sub: { en: 'Long table, open conversation', hy: 'Երկար սեղան, բաց զրույց' },
      },
      {
        time: '10:15',
        label: { en: 'Guided journaling', hy: 'Ուղղորդված օրագիր' },
        sub: {
          en: '15-minute reflective practice',
          hy: '15-րոպեանոց ինքնանդրադարձի պրակտիկա',
        },
      },
      {
        time: '10:30',
        label: { en: 'Intention circle', hy: 'Նպատակների շրջան' },
        sub: { en: 'Share or simply listen', hy: 'Կիսվեք կամ պարզապես լսեք',
        },
      },
      {
        time: '11:30',
        label: { en: 'Warm farewell', hy: 'Ջերմ հրաժեշտ' },
        sub: {
          en: 'Take the pace home with you',
          hy: 'Տարեք այս հանգիստ ռիթմը ձեզ հետ տուն',
        },
      },
    ],
    host: {
      name: { en: 'Ani Nazaryan', hy: 'Անի Նազարյան' },
      role: {
        en: 'Founder & Lead Facilitator',
        hy: 'Հիմնադիր և գլխավոր համակարգող',
      },
      imageUrl: null,
    },
    coordinates: {
      lat: 40.1872,
      lng: 44.5152,
      address: {
        en: 'Cascade Complex, Northern Avenue area, Yerevan, Armenia 0010',
        hy: 'Կասկադ համալիր, Հյուսիսային պողոտայի հատված, Երևան, Հայաստան 0010',
      },
    },
    maxCapacity: 12,
    bookedCount: 7,
    price: 8500,
    cardImageUrl:
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
    galleryImageUrls: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    slug: 'day-of-seva',
    status: EventStatus.ACTIVE,
    label: { en: 'Day of Seva', hy: 'Սևայի Օր' },
    title: {
      en: 'A Day of Seva · Community Garden',
      hy: 'Սևայի օր · Համայնքային այգի',
    },
    dates: { start: '2026-07-05 09:00', end: '2026-07-05 17:00' },
    location: {
      en: 'Aragatsotn village garden',
      hy: 'Արագածոտնի գյուղական այգի',
    },
    locationDetail: {
      en: 'Agarak Community Garden, Aragatsotn Province',
      hy: 'Ագարակի համայնքային այգի, Արագածոտնի մարզ',
    },
    shortDescription: {
      en: 'A free day of service, soil, and community. Help restore a heritage garden, share a meal, and leave something good behind.',
      hy: 'Կամավորական աշխատանքի, հողի և համայնքի անվճար օր։ Օգնեք վերականգնել ավանդական այգին, կիսեք կերակուրը և թողեք բարի հետք ձեզնից հետո։',
    },
    longDescription: {
      en: 'Seva means selfless service. We spend the day working with our hands in a village garden that is being restored by the local community — clearing, planting, building raised beds.<PARA>Lunch is cooked together over a fire from whatever the garden provides. No skill required, no expectations — just show up.',
      hy: 'Սևա նշանակում է անշահախնդիր ծառայություն։ Մենք անցկացնում ենք օրը՝ աշխատելով մեր ձեռքերով գյուղական այգում, որը վերականգնվում է տեղական համայնքի կողմից՝ մաքրում, տնկում, բարձր մարգերի պատրաստում։<PARA>Ճաշը պատրաստվում է միասին խարույկի վրա՝ այն ամենից, ինչ տալիս է այգին։ Ոչ մի հմտություն չի պահանջվում, ոչ մի ակնկալիք՝ պարզապես միացեք մեզ։',
    },
    includes: {
      en: [
        'Full day in the garden',
        'Communal fire-cooked lunch',
        'Tools & gloves provided',
        'Transport from central Yerevan',
        'A good feeling at the end',
        'Free to all — gift of time',
      ],
      hy: [
        'Ամբողջ օր այգում',
        'Խարույկի վրա պատրաստված համայնքային ճաշ',
        'Գործիքներ և ձեռնոցներ',
        'Տրանսպորտ Երևանի կենտրոնից',
        'Լավ զգացողություն օրվա վերջում',
        'Անվճար բոլորի համար՝ ժամանակի նվիրատվություն',
      ],
    },
    schedule: [
      {
        time: '08:30',
        label: { en: 'Depart from Yerevan', hy: 'Մեկնում Երևանից' },
        sub: {
          en: 'Shared transport, ~90min ride',
          hy: 'Համատեղ տրանսպորտ, մոտ 90 րոպե երթևեկություն',
        },
      },
      {
        time: '10:00',
        label: {
          en: 'Garden work begins',
          hy: 'Այգու աշխատանքների մեկնարկ',
        },
        sub: {
          en: 'Clearing, planting, building',
          hy: 'Մաքրում, տնկում, կառուցում',
        },
      },
      {
        time: '13:00',
        label: { en: 'Fire-cooked lunch', hy: 'Խարույկի վրա պատրաստված ճաշ' },
        sub: {
          en: 'Prepared together, eaten slowly',
          hy: 'Պատրաստվում է միասին, ուտում ենք հանգիստ մթնոլորտում',
        },
      },
      {
        time: '14:30',
        label: { en: 'Afternoon session', hy: 'Կեսօրից հետո աշխատանքներ' },
        sub: {
          en: 'More hands, lighter work',
          hy: 'Ավելի շատ ձեռքեր, ավելի թեթև աշխատանք',
        },
      },
      {
        time: '17:00',
        label: { en: 'Return to Yerevan', hy: 'Վերադարձ Երևան' },
        sub: { en: 'Arriving back ~18:30', hy: 'Վերադարձ ժամը ~18:30-ին' },
      },
    ],
    host: {
      name: { en: 'Ani Nazaryan', hy: 'Անի Նազարյան' },
      role: {
        en: 'Founder & Lead Facilitator',
        hy: 'Հիմնադիր և գլխավոր համակարգող',
      },
      imageUrl: null,
    },
    coordinates: {
      lat: 40.1872,
      lng: 44.5152,
      address: {
        en: 'Agarak Community Garden, Aragatsotn Province, Aragatsotn, Armenia',
        hy: 'Ագարակի համայնքային այգի, Արագածոտնի մարզ, Ագարակ, Հայաստան',
      },
    },
    maxCapacity: 20,
    bookedCount: 8,
    price: 0,
    cardImageUrl:
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
    galleryImageUrls: [
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    slug: 'breathwork-sound-healing',
    status: EventStatus.ACTIVE,
    label: { en: 'Breathwork & Sound', hy: 'Շնչառություն և Ձայն' },
    title: {
      en: 'Breathwork & Sound Healing',
      hy: 'Շնչառական պրակտիկա և ձայնային թերապիա',
    },
    dates: { start: '2026-07-12 10:00', end: '2026-07-12 13:30' },
    location: { en: 'Yerevan studio', hy: 'Երևանի ստուդիա' },
    locationDetail: {
      en: 'Studio at Saryan 28, Yerevan',
      hy: 'Ստուդիա Սարյան 28 հասցեում, Երևան',
    },
    shortDescription: {
      en: 'A half-day of guided breathwork, sound bath, and integration. No experience needed — just bring a mat and an open mind.',
      hy: 'Կեսօրյա ուղղորդված շնչառություն, ձայնային լոգանք և ամփոփում։ Փորձառություն չի պահանջվում. պարզապես վերցրեք գորգ և եղեք բաց նոր զգացողությունների համար։',
    },
    longDescription: {
      en: 'We begin with an opening circle and a short introduction to conscious breathing. The breathwork session itself runs for about 45 minutes — a series of breathing patterns that can take you somewhere quite unexpected.<PARA>We close with a 40-minute sound bath using singing bowls and a long integration period where you simply rest and let whatever came up settle. Expect to leave feeling deeply different.',
      hy: 'Մենք սկսում ենք բացման շրջանով և գիտակցված շնչառության կարճ ներածությամբ։ Շնչառական սեսիան տևում է մոտ 45 րոպե՝ շնչառական վարժությունների շարք, որոնք կարող են ձեզ տանել բոլորովին անսպասելի հոգեվիճակի։<PARA>Մենք ավարտում ենք 40-րոպեանոց ձայնային լոգանքով՝ տիբեթյան երգող գավաթների օգնությամբ, և տրամադրում ենք երկար ժամանակ ամփոփման համար, որտեղ դուք պարզապես հանգստանում եք և թույլ տալիս, որ ամեն ինչ խաղաղվի։ Պատրաստվեք հեռանալ խորապես փոխված զգացողություններով։',
    },
    includes: {
      en: [
        'Guided breathwork session (45 min)',
        'Sound bath (40 min)',
        'Integration & sharing circle',
        'Herbal tea & light snacks',
        'Yoga mat provided',
        'Guided journal prompt to take home',
      ],
      hy: [
        'Ուղղորդված շնչառական սեսիա (45 րոպե)',
        'Ձայնային լոգանք (40 րոպե)',
        'Ամփոփման և տպավորություններով կիսվելու շրջան',
        'Խոտաբուսային թեյ և թեթև խորտիկներ',
        'Յոգայի գորգ',
        'Տուն տանելու ուղղորդող հարցեր օրագրի համար',
      ],
    },
    schedule: [
      {
        time: '10:00',
        label: { en: 'Opening circle', hy: 'Բացման շրջան' },
        sub: { en: 'Grounding, intentions', hy: 'Կապ հողի հետ, նպատակներ' },
      },
      {
        time: '10:20',
        label: { en: 'Breathwork session', hy: 'Շնչառական սեսիա' },
        sub: { en: '45 minutes guided', hy: '45 րոպե ուղղորդված' },
      },
      {
        time: '11:10',
        label: { en: 'Rest & integration', hy: 'Հանգիստ և ամփոփում' },
        sub: { en: 'Stillness, music', hy: 'Լռություն, երաժշտություն' },
      },
      {
        time: '11:45',
        label: { en: 'Sound bath', hy: 'Ձայնային լոգանք' },
        sub: { en: '40 minutes of bowls', hy: '40 րոպե գավաթների հնչյուններ' },
      },
      {
        time: '12:30',
        label: { en: 'Sharing & tea', hy: 'Մտքերի փոխանակում և թեյ' },
        sub: {
          en: 'Open circle, no pressure',
          hy: 'Բաց շրջան, առանց պարտադրանքի',
        },
      },
      {
        time: '13:30',
        label: { en: 'Close', hy: 'Ավարտ' },
        sub: { en: 'Take your time leaving', hy: 'Մեկնեք առանց շտապելու' },
      },
    ],
    host: {
      name: { en: 'Varduhi Karapetyan', hy: 'Վարդուհի Կարապետյան' },
      role: { en: 'Wellness Guide', hy: 'Առողջ ապրելակերպի ուղեկցորդ' },
      imageUrl: null,
    },
    coordinates: {
      lat: 40.1872,
      lng: 44.5152,
      address: {
        en: 'Saryan 28, Kentron, Yerevan, Armenia 0002',
        hy: 'Սարյան 28, Կենտրոն, Երևան, Հայաստան 0002',
      },
    },
    maxCapacity: 16,
    bookedCount: 9,
    price: 12000,
    cardImageUrl:
        'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200&q=80',
    galleryImageUrls: [
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    slug: 'lake-sevan-picnic',
    status: EventStatus.ACTIVE,
    label: { en: 'Slow Picnic', hy: 'Հանգիստ Պիկնիկ' },
    title: {
      en: 'Slow Picnic at Lake Sevan',
      hy: 'Հանգիստ պիկնիկ Սևանա լճի ափին',
    },
    dates: { start: '2026-07-19 11:00', end: '2026-07-19 17:00' },
    location: { en: 'Lake Sevan', hy: 'Սևանա լիճ' },
    locationDetail: {
      en: 'Northern shore, Sevan Peninsula, Armenia',
      hy: 'Հյուսիսային ափ, Սևանի թերակղզի, Հայաստան',
    },
    shortDescription: {
      en: 'Blankets on the shore, stone-cold Sevan water, no agenda. An afternoon of slow time with good people.',
      hy: 'Ծածկոցներ ափին, Սևանի զով ջուրը, ոչ մի օրակարգ։ Հանգիստ կեսօր լավ մարդկանց միջավայրում։',
    },
    longDescription: {
      en: "This is as simple as it sounds: we gather on the northern shore of Lake Sevan, spread out on the grass, and have a long afternoon together.<PARA>There's food, water, a small musical set, and a lot of open time. Swim if you want. Read if you want. Talk or don't. We finish as the light goes golden over the water.",
      hy: 'Սա այնքան պարզ է, որքան հնչում է. մենք հավաքվում ենք Սևանա լճի հյուսիսային ափին, տեղավորվում խոտերի վրա և երկար կեսօր անցկացնում միասին։<PARA>Կլինի սնունդ, ջուր, փոքրիկ երաժշտական կատարումներ և շատ ազատ ժամանակ։ Լողացեք, եթե ցանկանում եք։ Կարդացեք, եթե ցանկանում եք։ Զրուցեք կամ պարզապես լռեք։ Մենք կավարտենք, երբ արևի ոսկեգույն լույսը տարածվի ջրի վրա։',
    },
    includes: {
      en: [
        'Shared slow lunch & snacks',
        'Transport from central Yerevan',
        'Small acoustic music set',
        'Swimming optional',
        'Hammock spots & blankets',
        'Return as the sun sets',
      ],
      hy: [
        'Համատեղ հանգիստ ճաշ և խորտիկներ',
        'Տրանսպորտ Երևանի կենտրոնից',
        'Փոքրիկ ակուստիկ երաժշտական ծրագիր',
        'Լողալու հնարավորություն (ըստ ցանկության)',
        'Համակներ և ծածկոցներ',
        'Վերադարձ մայրամուտին',
      ],
    },
    schedule: [
      {
        time: '09:30',
        label: { en: 'Depart Yerevan', hy: 'Մեկնում Երևանից' },
        sub: {
          en: 'Shared minivan, ~1h 15min',
          hy: 'Համատեղ մինիվեն, մոտ 1 ժամ 15 րոպե',
        },
      },
      {
        time: '11:00',
        label: { en: 'Arrive & settle', hy: 'Ժամանում և տեղավորում' },
        sub: {
          en: 'Find your spot on the shore',
          hy: 'Գտեք ձեր տեղը ափին',
        },
      },
      {
        time: '12:00',
        label: { en: 'Shared lunch', hy: 'Համատեղ ճաշ' },
        sub: { en: 'Long, slow, unhurried', hy: 'Երկար, հանգիստ, անշտապ' },
      },
      {
        time: '14:00',
        label: { en: 'Open afternoon', hy: 'Ազատ ժամանակ' },
        sub: {
          en: 'Swim, read, talk, rest',
          hy: 'Լողալ, կարդալ, զրուցել, հանգստանալ',
        },
      },
      {
        time: '16:30',
        label: { en: 'Music & golden hour', hy: 'Երաժշտություն և ոսկե ժամ' },
        sub: {
          en: 'Acoustic set as the light shifts',
          hy: 'Ակուստիկ կատարումներ լույսի փոփոխության ներքո',
        },
      },
      {
        time: '17:30',
        label: { en: 'Return to Yerevan', hy: 'Վերադարձ Երևան' },
        sub: { en: 'Arriving ~18:45', hy: 'Ժամանում մոտ ~18:45-ին' },
      },
    ],
    host: {
      name: { en: 'Ani Nazaryan', hy: 'Անի Նազարյան' },
      role: {
        en: 'Founder & Lead Facilitator',
        hy: 'Հիմնադիր և գլխավոր համակարգող',
      },
      imageUrl: null,
    },
    coordinates: {
      lat: 40.1872,
      lng: 44.5152,
      address: {
        en: 'Northern shore, Sevan Peninsula, Sevan, Gegharkunik 1201',
        hy: 'Սևանա թերակղզու հյուսիսային ափ, Սևան, Գեղարքունիք 1201',
      },
    },
    maxCapacity: 22,
    bookedCount: 11,
    price: 9000,
    cardImageUrl:
        'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
    galleryImageUrls: [
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
    ],
  },
];