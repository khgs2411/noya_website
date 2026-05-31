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
      brand: 'Noya Dance',
      language: { label: 'Choose language' },
      theme: { toggle: 'Toggle theme', light: 'Light', dark: 'Dark' },
      nav: { about: 'About', work: 'Work', classes: 'Classes', contact: 'Contact' },
      hero: {
        eyebrow: 'Contemporary dancer and movement artist',
        title: 'Movement with presence, precision, and breath.',
        body: 'A mobile-first home for performances, classes, and collaborations. Replace this copy with Noya’s voice when the brand direction is ready.',
        primary: 'Book a session',
        secondary: 'View work',
      },
      stats: {
        years: 'Years on stage',
        forms: 'Dance forms',
        cities: 'Cities taught',
      },
      about: {
        eyebrow: 'About the artist',
        title: 'A quiet, powerful stage presence for intimate rooms and large productions.',
        body: 'Use this section for a short bio: training, movement language, performance experience, and the emotional promise of working with her.',
      },
      work: {
        title: 'Featured directions',
        performance: 'Performances',
        performanceBody: 'Solo work, productions, events, and collaborations.',
        classes: 'Classes',
        classesBody: 'Technique, expression, confidence, and stage presence.',
        creation: 'Creation',
        creationBody: 'Choreography, movement direction, and custom pieces.',
      },
      gallery: { title: 'Visual rhythm', itemOne: 'Studio portrait', itemTwo: 'Live movement', itemThree: 'Rehearsal texture' },
      contact: {
        title: 'Start with a simple conversation.',
        body: 'This skeleton is ready for a real booking form or direct WhatsApp/Instagram link once the contact flow is chosen.',
        cta: 'Get in touch',
      },
      footer: 'Built as a multilingual mobile-first foundation.',
    },
  },
  ru: {
    translation: {
      brand: 'Noya Dance',
      language: { label: 'Выбрать язык' },
      theme: { toggle: 'Сменить тему', light: 'Светлая', dark: 'Темная' },
      nav: { about: 'Обо мне', work: 'Работы', classes: 'Занятия', contact: 'Контакт' },
      hero: {
        eyebrow: 'Современная танцовщица и артистка движения',
        title: 'Движение с присутствием, точностью и дыханием.',
        body: 'Мобильная основа для выступлений, занятий и коллабораций. Позже этот текст можно заменить на настоящий голос Нои.',
        primary: 'Записаться',
        secondary: 'Смотреть работы',
      },
      stats: {
        years: 'Лет на сцене',
        forms: 'Танцевальных направлений',
        cities: 'Городов преподавания',
      },
      about: {
        eyebrow: 'Об артистке',
        title: 'Тихое, сильное сценическое присутствие для камерных пространств и больших постановок.',
        body: 'Здесь будет короткая биография: обучение, язык движения, опыт выступлений и ощущение от работы с ней.',
      },
      work: {
        title: 'Основные направления',
        performance: 'Выступления',
        performanceBody: 'Соло, постановки, события и коллаборации.',
        classes: 'Занятия',
        classesBody: 'Техника, выражение, уверенность и сценическое присутствие.',
        creation: 'Создание',
        creationBody: 'Хореография, движение для проектов и индивидуальные номера.',
      },
      gallery: { title: 'Визуальный ритм', itemOne: 'Студийный портрет', itemTwo: 'Живое движение', itemThree: 'Репетиционная фактура' },
      contact: {
        title: 'Начнем с простого разговора.',
        body: 'Основа готова для формы записи или прямой ссылки на WhatsApp/Instagram, когда будет выбран сценарий связи.',
        cta: 'Связаться',
      },
      footer: 'Многоязычная мобильная основа для сайта.',
    },
  },
  he: {
    translation: {
      brand: 'Noya Dance',
      language: { label: 'בחירת שפה' },
      theme: { toggle: 'החלפת מצב תצוגה', light: 'בהיר', dark: 'כהה' },
      nav: { about: 'עליי', work: 'עבודות', classes: 'שיעורים', contact: 'יצירת קשר' },
      hero: {
        eyebrow: 'רקדנית עכשווית ואמנית תנועה',
        title: 'תנועה עם נוכחות, דיוק ונשימה.',
        body: 'בסיס מובייל-פירסט להופעות, שיעורים ושיתופי פעולה. בהמשך נחליף את הטקסט בקול האמיתי של נויה.',
        primary: 'לתיאום שיעור',
        secondary: 'לצפייה בעבודות',
      },
      stats: {
        years: 'שנים על במה',
        forms: 'סגנונות תנועה',
        cities: 'ערי הוראה',
      },
      about: {
        eyebrow: 'על האמנית',
        title: 'נוכחות במה שקטה וחזקה לחללים אינטימיים ולהפקות גדולות.',
        body: 'כאן תיכנס ביוגרפיה קצרה: הכשרה, שפת תנועה, ניסיון במה והחוויה של עבודה איתה.',
      },
      work: {
        title: 'כיוונים מרכזיים',
        performance: 'הופעות',
        performanceBody: 'סולו, הפקות, אירועים ושיתופי פעולה.',
        classes: 'שיעורים',
        classesBody: 'טכניקה, ביטוי, ביטחון ונוכחות במה.',
        creation: 'יצירה',
        creationBody: 'כוריאוגרפיה, בימוי תנועה וקטעים מותאמים אישית.',
      },
      gallery: { title: 'קצב ויזואלי', itemOne: 'פורטרט סטודיו', itemTwo: 'תנועה חיה', itemThree: 'טקסטורת חזרה' },
      contact: {
        title: 'מתחילים משיחה פשוטה.',
        body: 'הבסיס מוכן לטופס הרשמה אמיתי או קישור ישיר ל-WhatsApp/Instagram אחרי שנבחר את זרימת יצירת הקשר.',
        cta: 'יצירת קשר',
      },
      footer: 'בסיס אתר רב-לשוני ומובייל-פירסט.',
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
