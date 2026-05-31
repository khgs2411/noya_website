import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

export const languages = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ru', label: 'Русский', dir: 'ltr' },
  { code: 'he', label: 'עברית', dir: 'rtl' },
] as const

export type LanguageCode = (typeof languages)[number]['code']

const resources = {
  en: {
    translation: {
      brand: { first: 'Noya', second: 'Dance' },
      language: { label: 'Choose language' },
      menu: { toggle: 'Open menu' },
      theme: { toggle: 'Toggle theme', light: 'Light', dark: 'Dark' },
      nav: { about: 'About', work: 'Work', classes: 'Classes', contact: 'Contact' },
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
        body: 'Dance has been my language\nfor as long as I can remember.\nThrough movement, I found\nfreedom, confidence, and\nconnection - and now I am here\nto help you find that too.',
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
      gallery: { title: 'Photo Moments' },
      contact: {
        title: "Let's Connect",
        body: "Have a question or want to work together? I'd love to hear from you.",
        cta: 'Get in touch',
        location: 'Dubai, UAE',
      },
      footer: '© 2025 Noya Dance. All rights reserved.',
    },
  },
  ru: {
    translation: {
      brand: { first: 'Noya', second: 'Dance' },
      language: { label: 'Выбрать язык' },
      menu: { toggle: 'Открыть меню' },
      theme: { toggle: 'Сменить тему', light: 'Светлая', dark: 'Темная' },
      nav: { about: 'Обо мне', work: 'Работы', classes: 'Занятия', contact: 'Контакт' },
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
        body: 'Танец был моим языком\nстолько, сколько я себя помню.\nЧерез движение я нашла\nсвободу, уверенность и связь -\nи теперь хочу помочь вам\nнайти это тоже.',
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
      gallery: { title: 'Фото моменты' },
      contact: {
        title: 'Свяжемся',
        body: 'Есть вопрос или хотите работать вместе? Я буду рада услышать вас.',
        cta: 'Связаться',
        location: 'Дубай, ОАЭ',
      },
      footer: '© 2025 Noya Dance. Все права защищены.',
    },
  },
  he: {
    translation: {
      brand: { first: 'Noya', second: 'Dance' },
      language: { label: 'בחירת שפה' },
      menu: { toggle: 'פתיחת תפריט' },
      theme: { toggle: 'החלפת מצב תצוגה', light: 'בהיר', dark: 'כהה' },
      nav: { about: 'עליי', work: 'עבודות', classes: 'שיעורים', contact: 'יצירת קשר' },
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
        body: 'ריקוד הוא השפה שלי\nמאז שאני זוכרת את עצמי.\nדרך תנועה מצאתי חופש,\nביטחון וחיבור - ועכשיו אני כאן\nכדי לעזור גם לך למצוא את זה.',
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
      gallery: { title: 'רגעים בתמונה' },
      contact: {
        title: 'בואו נדבר',
        body: 'יש לך שאלה או רצון לעבוד יחד? אשמח לשמוע ממך.',
        cta: 'יצירת קשר',
        location: 'דובאי, איחוד האמירויות',
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
    fallbackLng: 'en',
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
syncDocumentLanguage(i18n.resolvedLanguage ?? i18n.language ?? 'en')

export default i18n
