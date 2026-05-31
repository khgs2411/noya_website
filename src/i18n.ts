import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

export const languages = [
  { code: 'he', label: 'עברית', dir: 'rtl' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ru', label: 'Русский', dir: 'ltr' },
] as const

export type LanguageCode = (typeof languages)[number]['code']

const resources = {
  en: {
    translation: {
      brand: { first: 'Noya', second: 'Dance' },
      language: { label: 'Choose language' },
      menu: { toggle: 'Open menu', close: 'Close menu' },
      theme: { toggle: 'Toggle theme', light: 'Light', dark: 'Dark' },
      nav: { about: 'About', work: 'Work', classes: 'Classes', lessons: 'Lessons', contact: 'Contact' },
      actions: { readMore: 'Read more', readLess: 'Show less', close: 'Close', back: 'Go back' },
      hero: {
        eyebrow: 'Move. Express. Inspire.',
        titleTop: 'Noya',
        titleBottom: 'Dance',
        body: 'Professional dancer and instructor sharing the art of movement, empowerment, and expression.',
        classes: 'Classes',
        private: 'Private sessions',
      },
      about: {
        title: 'About',
        mobilePreview:
          'Nice to meet you, I am Noya Shlomo HaCohen.\nI am 31, mother to Lachen, a dancer, choreographer, and dance teacher for more than 13 years.',
        body: 'Nice to meet you, I am Noya Shlomo HaCohen.\nI am 31, mother to Lachen, a dancer, choreographer, and dance teacher for more than 13 years.\n\nI began my professional path with Nadine Bommer in Rishon LeZion, and from there continued into the world of stage and performance. Over the years I have danced and taken part in a wide range of productions, including musicals at the Cameri Theatre and Tel Aviv Theatre, alongside professional work in dance and stage performance.\n\nDance has always been much more than movement for me. It was the place where I learned to express myself, connect inward, and feel free.\n\nAfter the birth of my daughter, Lachen, another world opened for me. I began studying mat Pilates and later equipment Pilates, and discovered the deep connection between body, breath, movement, and inner strength. From my own personal journey came my love for guiding women through a process that connects strength, posture, confidence, and joy in the body.\n\nOver the years I have taught ballet, jazz, musicals, and lyrical dance. In the last two years, I chose to focus mainly on working with women and adults, from the understanding that movement can be much more than a workout. It can be a place of healing, expression, and connection to yourself.\n\nWhat moves me more than anything is seeing a woman enter my studio and allow herself to meet the girl within her again. The one who always dreamed of dancing, the one who may have put herself aside over the years, and the one who wants to feel alive, strong, and free again, this time from a more mature, whole, and connected place.\n\nI believe every woman deserves a place where she can grow stronger, release, move, breathe, and feel at home in her body.\n\nI do not teach only movement. I create a space where women return to themselves through the body.',
        cta: 'My story',
      },
      services: {
        title: 'Dance Services',
        classes: 'Classes',
        classesBody: 'Group classes for all levels. Build strength, flow, and confidence together.',
        private: 'Private sessions',
        privateBody: 'Personalized 1:1 training designed around your goals and your journey.',
      },
      classes: {
        title: 'Upcoming Classes',
        viewAll: 'View all',
        month: 'May',
        flow: 'Contemporary Flow',
        flowTime: 'Sat, May 24 - 10:00 AM',
        lines: 'Strength & Lines',
        linesTime: 'Tue, May 27 - 7:00 PM',
        jazz: 'Jazz & Expression',
        jazzTime: 'Thu, May 29 - 6:30 PM',
      },
      lessons: {
        eyebrow: 'Readonly schedule',
        title: "Women's Jazz Lyrical Classes",
        days: 'Tuesdays at 9:00 / Thursdays at 9:00',
        duration: 'Lesson duration: 75 minutes',
        entry: 'Entry',
        count: 'Lessons',
        price: 'Price',
        validity: 'Valid for',
        location: '1 Dolev Street, Mazkeret Batya\n1 Moshe Lehrer Street, Ness Ziona',
        phone: 'Details and registration: Noya Shlomo 0536237331',
        rows: {
          intro: { entry: 'Intro lesson' },
          single: { entry: 'Single lesson' },
          card: { entry: 'Class card' },
          once: 'One time',
          threeMonths: 'Three months',
        },
      },
      gallery: { title: 'Photo Moments' },
      contact: {
        title: "Let's Connect",
        body: "Have a question or want to work together? I'd love to hear from you.",
        cta: 'Get in touch',
        location: 'Dubai, UAE',
        studios: '1 Dolev Street, Mazkeret Batya\n1 Moshe Lehrer Street, Ness Ziona',
      },
      footer: '© 2025 Noya Dance. All rights reserved.',
    },
  },
  ru: {
    translation: {
      brand: { first: 'Noya', second: 'Dance' },
      language: { label: 'Выбрать язык' },
      menu: { toggle: 'Открыть меню', close: 'Закрыть меню' },
      theme: { toggle: 'Сменить тему', light: 'Светлая', dark: 'Темная' },
      nav: { about: 'Обо мне', work: 'Работы', classes: 'Занятия', lessons: 'Расписание', contact: 'Контакт' },
      actions: { readMore: 'Читать дальше', readLess: 'Свернуть', close: 'Закрыть', back: 'Назад' },
      hero: {
        eyebrow: 'Двигайся. Выражай. Вдохновляй.',
        titleTop: 'Noya',
        titleBottom: 'Dance',
        body: 'Профессиональная танцовщица и преподаватель, делящаяся искусством движения, силы и самовыражения.',
        classes: 'Занятия',
        private: 'Личные сессии',
      },
      about: {
        title: 'О',
        mobilePreview:
          'Приятно познакомиться, я Ноя Шломо ха-Коэн.\nМне 31 год, я мама Лахен, танцовщица, хореограф и преподаватель танца уже более 13 лет.',
        body: 'Приятно познакомиться, я Ноя Шломо ха-Коэн.\nМне 31 год, я мама Лахен, танцовщица, хореограф и преподаватель танца уже более 13 лет.\n\nСвой профессиональный путь я начала у Надин Боммер в Ришон-ле-Ционе, а затем продолжила в мире сцены и выступлений. За эти годы я танцевала и участвовала в разных постановках, среди них мюзиклы в театре Камери и Театре Тель-Авива, а также профессиональная работа в мире танца и сцены.\n\nТанец всегда был для меня намного больше, чем движение. Это было место, где я научилась выражать себя, соединяться с собой и чувствовать свободу.\n\nПосле рождения моей дочери Лахен для меня открылся еще один мир. Я начала изучать пилатес на мате, а позже пилатес на оборудовании, и открыла глубокую связь между телом, дыханием, движением и внутренней силой. Из моего личного пути родилась и любовь к сопровождению женщин через процесс, который соединяет силу, осанку, уверенность и удовольствие от собственного тела.\n\nЗа эти годы я преподавала балет, джаз, мюзиклы и лирический танец. В последние два года я выбрала сосредоточиться в основном на работе с женщинами и взрослыми, понимая, что движение может быть намного больше, чем тренировка. Оно может стать местом исцеления, выражения и соединения с собой.\n\nБольше всего меня трогает видеть женщину, которая входит в мою студию и позволяет себе снова встретить девочку внутри себя. Ту, которая всегда мечтала танцевать, ту, которая, возможно, годами отодвигала себя в сторону, и ту, которая хочет снова почувствовать себя живой, сильной и свободной, но теперь из более зрелого, цельного и связанного места.\n\nЯ верю, что каждая женщина заслуживает место, где она может укрепиться, отпустить напряжение, двигаться, дышать и чувствовать себя дома в своем теле.\n\nЯ не преподаю только движение. Я создаю пространство, где женщины возвращаются к себе через тело.',
        cta: 'Моя история',
      },
      services: {
        title: 'Танцевальные услуги',
        classes: 'Занятия',
        classesBody: 'Групповые занятия для всех уровней. Сила, поток и уверенность вместе.',
        private: 'Личные сессии',
        privateBody: 'Персональная тренировка 1:1 под ваши цели и ваш путь.',
      },
      classes: {
        title: 'Ближайшие занятия',
        viewAll: 'Все',
        month: 'Май',
        flow: 'Contemporary Flow',
        flowTime: 'Сб, 24 мая - 10:00',
        lines: 'Strength & Lines',
        linesTime: 'Вт, 27 мая - 19:00',
        jazz: 'Jazz & Expression',
        jazzTime: 'Чт, 29 мая - 18:30',
      },
      lessons: {
        eyebrow: 'Только для чтения',
        title: 'Женские занятия Jazz Lyrical',
        days: 'Вторник 9:00 / четверг 9:00',
        duration: 'Длительность занятия: 75 минут',
        entry: 'Вход',
        count: 'Занятия',
        price: 'Цена',
        validity: 'Срок',
        location: 'ул. Долев 1, Мазкерет-Батья\nул. Моше Лерер 1, Нес-Циона',
        phone: 'Подробности и запись: Ноя Шломо 0536237331',
        rows: {
          intro: { entry: 'Пробное занятие' },
          single: { entry: 'Разовое занятие' },
          card: { entry: 'Абонемент' },
          once: 'Одноразово',
          threeMonths: '3 месяца',
        },
      },
      gallery: { title: 'Фото моменты' },
      contact: {
        title: 'Свяжемся',
        body: 'Есть вопрос или хотите работать вместе? Я буду рада услышать вас.',
        cta: 'Связаться',
        location: 'Дубай, ОАЭ',
        studios: 'ул. Долев 1, Мазкерет-Батья\nул. Моше Лерер 1, Нес-Циона',
      },
      footer: '© 2025 Noya Dance. Все права защищены.',
    },
  },
  he: {
    translation: {
      brand: { first: 'Noya', second: 'Dance' },
      language: { label: 'בחירת שפה' },
      menu: { toggle: 'פתיחת תפריט', close: 'סגירת תפריט' },
      theme: { toggle: 'החלפת מצב תצוגה', light: 'בהיר', dark: 'כהה' },
      nav: { about: 'עליי', work: 'עבודות', classes: 'שיעורים', lessons: 'מערכת שיעורים', contact: 'יצירת קשר' },
      actions: { readMore: 'קראי עוד', readLess: 'סגירה', close: 'סגירה', back: 'חזרה' },
      hero: {
        eyebrow: 'לנוע. לבטא. להשראה.',
        titleTop: 'Noya',
        titleBottom: 'Dance',
        body: 'רקדנית ומדריכה מקצועית המשתפת את אמנות התנועה, העצמה וביטוי אישי.',
        classes: 'שיעורים',
        private: 'שיעורים פרטיים',
      },
      about: {
        title: 'על',
        mobilePreview: 'נעים להכיר, אני נויה שלמה הכהן\nבת 31, אמא ללחן, רקדנית, כוריאוגרפית ומורה למחול כבר למעלה מ־13 שנים.',
        body: 'נעים להכיר, אני נויה שלמה הכהן\nבת 31, אמא ללחן, רקדנית, כוריאוגרפית ומורה למחול כבר למעלה מ־13 שנים.\n\nאת דרכי המקצועית התחלתי אצל נדין בומר בראשון לציון, ומשם המשכתי לעולם הבמה וההופעות. לאורך השנים רקדתי והשתתפתי בהפקות מגוונות, ביניהן מחזות זמר בתיאטרון הקאמרי ובתיאטרון תל אביב, לצד עבודה מקצועית בעולם המחול והבמה.\n\nהריקוד תמיד היה עבורי הרבה יותר מתנועה. הוא היה המקום שבו למדתי לבטא את עצמי, להתחבר פנימה ולהרגיש חופש.\n\nאחרי לידת בתי, לחן, נפתח עבורי עולם נוסף. התחלתי ללמוד פילאטיס מזרן ובהמשך פילאטיס מכשירים, וגיליתי את החיבור העמוק בין גוף, נשימה, תנועה וחיזוק פנימי. מתוך המסע האישי שלי נולדה גם האהבה לליווי נשים - דרך תהליך שמחבר בין כוח, יציבה, ביטחון והנאה מהגוף.\n\nלאורך השנים לימדתי בלט, ג׳אז, מחזות זמר ומחול לירי. בשנתיים האחרונות בחרתי להתמקד בעיקר בעבודה עם נשים ובוגרות, מתוך הבנה שהתנועה יכולה להיות הרבה יותר מאימון - היא יכולה להיות מקום של ריפוי, ביטוי וחיבור לעצמך.\n\nהדבר שמרגש אותי יותר מכל הוא לראות אישה שנכנסת לסטודיו שלי ומרשה לעצמה לפגוש מחדש את הילדה שבה. זו שתמיד חלמה לרקוד, זו שאולי הניחה את עצמה בצד לאורך השנים, וזו שרוצה לחזור להרגיש חיה, חזקה ומשוחררת - אבל הפעם ממקום בוגר, שלם ומחובר יותר.\n\nאני מאמינה שלכל אישה מגיע מקום שבו היא יכולה להתחזק, להשתחרר, לזוז, לנשום ולהרגיש בבית בתוך הגוף שלה.\n\nאני לא מלמדת רק תנועה. אני יוצרת מרחב שבו נשים חוזרות לעצמן דרך הגוף.',
        cta: 'הסיפור שלי',
      },
      services: {
        title: 'שירותי ריקוד',
        classes: 'שיעורים',
        classesBody: 'שיעורים קבוצתיים לכל הרמות. בונות כוח, זרימה וביטחון יחד.',
        private: 'שיעורים פרטיים',
        privateBody: 'אימון אישי 1:1 שנבנה סביב המטרות והדרך שלך.',
      },
      classes: {
        title: 'שיעורים קרובים',
        viewAll: 'הצג הכל',
        month: 'מאי',
        flow: 'Contemporary Flow',
        flowTime: 'שבת, 24 במאי - 10:00',
        lines: 'Strength & Lines',
        linesTime: 'שלישי, 27 במאי - 19:00',
        jazz: 'Jazz & Expression',
        jazzTime: 'חמישי, 29 במאי - 18:30',
      },
      lessons: {
        eyebrow: 'מערכת קריאה בלבד',
        title: "שיעורי נשים ג'אז לירי",
        days: 'ימי שלישי 9:00 / ימי חמישי 9:00',
        duration: 'משך השיעור: 75 דקות',
        entry: 'כניסה',
        count: 'כמות שיעורים',
        price: 'מחיר',
        validity: 'תוקף',
        location: 'דולב 1, מזכרת בתיה\nמשה לרר 1, נס ציונה',
        phone: 'לפרטים והרשמה: נויה שלמה 0536237331',
        rows: {
          intro: { entry: 'שיעור היכרות' },
          single: { entry: 'שיעור בודד' },
          card: { entry: 'כרטיסייה' },
          once: 'חד פעמי',
          threeMonths: 'תקף לשלושה חודשים',
        },
      },
      gallery: { title: 'רגעים בתמונה' },
      contact: {
        title: 'בואו נדבר',
        body: 'יש לך שאלה או רצון לעבוד יחד? אשמח לשמוע ממך.',
        cta: 'יצירת קשר',
        location: 'דובאי, איחוד האמירויות',
        studios: 'דולב 1, מזכרת בתיה\nמשה לרר 1, נס ציונה',
      },
      footer: '© 2025 Noya Dance. כל הזכויות שמורות.',
    },
  },
} as const

function getLanguageDirection(language: string) {
  return languages.find((item) => item.code === language.split('-')[0])?.dir ?? 'ltr'
}

function syncDocumentLanguage(language: string) {
  if (typeof document === 'undefined') return

  const languageCode = language.split('-')[0]
  document.documentElement.lang = languageCode
  document.documentElement.dir = getLanguageDirection(languageCode)
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'he',
    supportedLngs: languages.map((language) => language.code),
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'noya-language',
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

i18n.on('languageChanged', syncDocumentLanguage)
syncDocumentLanguage(i18n.resolvedLanguage ?? i18n.language ?? 'he')

export default i18n
