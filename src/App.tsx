import { ArrowRight, Mail, MapPin, Menu, Moon, Phone, Star, Sun, Users, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { LanguageMenu } from '@/components/layout/language-menu'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'

const images = {
  hero: '/images/9D661F78-FE6E-4ECF-960D-8FE8C888CB91.jpg',
  portrait: '/images/976EFAC9-76C5-4B1A-AD92-F6A051E7CC31.jpg',
  leap: '/images/IMG_2109.jpg',
  leapWide: '/images/IMG_2101.jpg',
  private: '/images/IMG_2105.jpg',
  rehearsal: '/images/3f126190-c261-48b2-9c94-d6c20c94365b.jpg',
  group: '/images/750f785f-80db-4158-825b-c5f7ff958837.jpg',
  ballet: '/images/נולדהלרקוד.jpg',
}

const classes = [
  { date: '24', title: 'classes.flow', time: 'classes.flowTime', image: images.leap },
  { date: '27', title: 'classes.lines', time: 'classes.linesTime', image: images.rehearsal },
  { date: '29', title: 'classes.jazz', time: 'classes.jazzTime', image: images.group },
]

const gallery = [images.hero, images.portrait, images.leap, images.private, images.group, images.rehearsal, images.ballet]

const lessonRows = [
  { entry: 'lessons.rows.intro.entry', count: '1', price: '60₪', validity: 'lessons.rows.once' },
  { entry: 'lessons.rows.single.entry', count: '1', price: '70₪', validity: 'lessons.rows.once' },
  { entry: 'lessons.rows.card.entry', count: '8', price: '480₪', validity: 'lessons.rows.threeMonths' },
  { entry: 'lessons.rows.card.entry', count: '12', price: '660₪', validity: 'lessons.rows.threeMonths' },
  { entry: 'lessons.rows.card.entry', count: '16', price: '800₪', validity: 'lessons.rows.threeMonths' },
]

const lessonsPath = '/lessons'

export default function App() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [aboutExpanded, setAboutExpanded] = useState(false)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    function handleNavigation() {
      setPath(window.location.pathname)
    }

    window.addEventListener('popstate', handleNavigation)
    return () => window.removeEventListener('popstate', handleNavigation)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen || activeImage ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen, activeImage])

  if (path === lessonsPath) {
    return <LessonsPage />
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <section id="top" className="hero-shell relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[48rem] w-full overflow-hidden opacity-24 md:inset-x-auto md:end-0 md:w-[52%] md:max-w-[46rem] md:opacity-100">
          <img src={images.hero} alt="" className="size-full object-cover object-[52%_18%] grayscale" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/18 to-transparent" />
          <div className="absolute inset-y-0 start-0 w-28 bg-gradient-to-r from-background to-transparent" />
        </div>

        <header className="relative z-40 mx-auto flex max-w-6xl items-start justify-between gap-5 px-5 py-5 sm:px-8">
          <a href="#top" className="leading-none">
            <span className="font-script block text-5xl text-foreground sm:text-6xl">{t('brand.first')}</span>
            <span className="ms-10 block text-xs font-semibold tracking-[0.58em] text-foreground/70">{t('brand.second')}</span>
          </a>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-12 rounded-full bg-blush/58 text-foreground shadow-sm hover:bg-blush/80 sm:size-14 [&_svg]:!size-6"
              aria-label={t('theme.toggle')}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Moon /> : <Sun />}
            </Button>
            <LanguageMenu buttonClassName="size-12 shadow-sm sm:size-14 [&_svg]:!size-6" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-16 rounded-full bg-blush text-foreground shadow-sm ring-4 ring-blush/18 hover:bg-blush/85 sm:size-20 [&_svg]:!size-8"
              aria-label={t('menu.toggle')}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu />
            </Button>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid max-w-6xl gap-8 px-5 pb-8 pt-8 sm:px-8 md:grid-cols-[0.9fr_1.1fr] md:pb-0 md:pt-8">
          <div className="max-w-xl">
            <p className="mb-6 text-sm font-medium uppercase tracking-[0.24em] text-foreground/70">{t('hero.eyebrow')}</p>
            <h1 className="font-serif text-[4.7rem] font-semibold leading-[0.76] tracking-normal text-foreground sm:text-[7.6rem]">
              {t('hero.titleTop')}
              <br />
              {t('hero.titleBottom')}
            </h1>
            <div className="mt-5 h-1 w-48 rounded-full bg-blush" />
            <p className="mt-6 max-w-md text-lg leading-7 text-foreground/70">{t('hero.body')}</p>
            <div className="mt-8 flex max-w-sm flex-col gap-3">
              <PillLink href={lessonsPath}>{t('hero.classes')}</PillLink>
              <PillLink href={lessonsPath} variant="outline">
                {t('hero.private')}
              </PillLink>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="relative mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 md:grid-cols-[0.8fr_1.2fr] md:items-start">
        <img src={images.portrait} alt="" className="h-80 w-full rounded-[1.65rem] object-cover object-top grayscale md:sticky md:top-8 md:h-[32rem]" />
        <div className="relative rounded-[1.8rem] bg-card/62 p-7 shadow-soft sm:p-8">
          <div className="floral-mark" aria-hidden="true" />
          <h2 className="font-serif text-5xl leading-none">
            {t('about.title')}{' '}
            <span className="font-script text-6xl font-normal text-blush-strong">{t('brand.first')}</span>
          </h2>
          <div className="mt-4 h-0.5 w-28 bg-blush" />
          <div className="relative">
            <p className="mt-6 max-w-2xl whitespace-pre-line text-base leading-7 text-foreground/72">
              <span className="md:hidden">{aboutExpanded ? t('about.body') : t('about.mobilePreview')}</span>
              <span className="hidden md:inline">{t('about.body')}</span>
            </p>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-full border-blush px-8 text-sm font-semibold uppercase tracking-[0.18em] text-blush-strong md:hidden"
              onClick={() => setAboutExpanded((current) => !current)}
            >
              {aboutExpanded ? t('actions.readLess') : t('actions.readMore')}
            </Button>
            <PillLink href="#work" className="max-w-56">
              {t('about.cta')}
            </PillLink>
          </div>
        </div>
      </section>

      <section id="work" className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
        <SectionTitle>{t('services.title')}</SectionTitle>
        <div className="mt-5 grid gap-8 md:grid-cols-2">
          <ServiceCard href={lessonsPath} icon={<Users />} image={images.leap} title={t('services.classes')} body={t('services.classesBody')} />
          <ServiceCard href={lessonsPath} icon={<Star />} image={images.private} title={t('services.private')} body={t('services.privateBody')} />
        </div>
      </section>

      <section id="classes" className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-serif text-4xl sm:text-5xl">{t('classes.title')}</h2>
          <PillLink href={lessonsPath} variant="outline" className="hidden min-w-48 sm:flex">
            {t('classes.viewAll')}
          </PillLink>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {classes.map((item) => (
            <a key={item.date} href={lessonsPath} className="overflow-hidden rounded-[1.1rem] bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-xl">
              <div className="relative h-36">
                <img src={item.image} alt="" className="size-full object-cover" />
                <div className="absolute start-4 top-4 rounded-sm bg-blush px-5 py-2 text-center text-primary-foreground">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em]">{t('classes.month')}</p>
                  <p className="text-4xl leading-none">{item.date}</p>
                </div>
              </div>
              <div className="px-5 py-4 text-center">
                <h3 className="text-lg font-medium">{t(item.title)}</h3>
                <p className="mt-1 text-sm text-foreground/62">{t(item.time)}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="bg-muted/50 py-7">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <h2 className="font-serif text-4xl sm:text-5xl">{t('gallery.title')}</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {gallery.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className="group relative overflow-hidden rounded-xl transition duration-300 hover:z-10 hover:-translate-y-1 hover:scale-[1.04] hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setActiveImage(image)}
              >
                <img
                  src={image}
                  alt=""
                  className="h-28 w-full object-cover grayscale transition duration-300 group-hover:scale-[1.03] group-hover:grayscale-0"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer id="contact" className="mx-auto max-w-6xl px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 sm:px-8 md:pb-8">
        <div className="relative grid gap-8 rounded-[1.35rem] border border-blush/55 bg-card/80 p-6 pb-8 md:grid-cols-[1fr_1fr] md:overflow-hidden">
          <div className="floral-mark floral-mark-start" aria-hidden="true" />
          <div>
            <h2 className="font-serif text-4xl">{t('contact.title')}</h2>
            <p className="mt-2 max-w-sm text-sm leading-5 text-foreground/62">{t('contact.body')}</p>
            <PillLink href="mailto:hello@noyadance.com" className="mt-4 max-w-52">
              {t('contact.cta')}
            </PillLink>
          </div>
          <div className="relative z-10 grid gap-4 text-sm text-foreground/74">
            <ContactLine icon={<Mail />} text="hello@noyadance.com" />
            <ContactLink href="https://www.instagram.com/noyashlomo?utm_source=qr" icon={<InstagramIcon />} text="Instagram" />
            <ContactLink href="https://www.tiktok.com/@noyalachan?_r=1&_t=ZS-96pJauUzNoO" icon={<TikTokIcon />} text="TikTok" />
            <ContactLine icon={<MapPin />} text={t('contact.studios')} />
          </div>
        </div>
        <div className="mt-5 rounded-t-md bg-blush px-4 py-3 text-center text-xs text-primary-foreground">{t('footer')}</div>
      </footer>

      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/28 backdrop-blur-sm"
            aria-label={t('menu.close')}
            onClick={() => setMenuOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={t('menu.toggle')}
            className="absolute inset-y-0 end-0 flex w-[min(22rem,86vw)] flex-col overflow-y-auto bg-card px-7 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <a href="#top" className="leading-none" onClick={() => setMenuOpen(false)}>
                <span className="font-script block text-5xl text-blush-strong">{t('brand.first')}</span>
                <span className="ms-8 block text-xs font-semibold tracking-[0.5em] text-foreground/62">{t('brand.second')}</span>
              </a>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-12 rounded-full bg-blush/50 hover:bg-blush/75 [&_svg]:!size-6"
                aria-label={t('menu.close')}
                onClick={() => setMenuOpen(false)}
              >
                <X />
              </Button>
            </div>
            <nav className="mt-12 grid gap-5 text-3xl font-serif">
              <div className="mb-2 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-14 w-full rounded-2xl bg-blush/25 text-foreground hover:bg-blush/40 [&_svg]:!size-6"
                  aria-label={t('theme.toggle')}
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? <Moon /> : <Sun />}
                </Button>
                <LanguageMenu buttonClassName="h-14 w-full rounded-2xl bg-blush/25 hover:bg-blush/40 [&_svg]:!size-6" panelClassName="end-0 top-16" />
              </div>
              <SidebarLink href="#about" onClick={() => setMenuOpen(false)}>
                {t('nav.about')}
              </SidebarLink>
              <SidebarLink href="#work" onClick={() => setMenuOpen(false)}>
                {t('nav.work')}
              </SidebarLink>
              <SidebarLink href="#classes" onClick={() => setMenuOpen(false)}>
                {t('nav.classes')}
              </SidebarLink>
              <SidebarLink href={lessonsPath} onClick={() => setMenuOpen(false)}>
                {t('nav.lessons')}
              </SidebarLink>
              <SidebarLink href="#contact" onClick={() => setMenuOpen(false)}>
                {t('nav.contact')}
              </SidebarLink>
            </nav>
            <div className="mt-8 grid gap-3 border-t border-border pt-6 text-sm text-foreground/70">
              <ContactLine icon={<Mail />} text="hello@noyadance.com" />
              <ContactLink href="https://www.instagram.com/noyashlomo?utm_source=qr" icon={<InstagramIcon />} text="Instagram" />
              <ContactLink href="https://www.tiktok.com/@noyalachan?_r=1&_t=ZS-96pJauUzNoO" icon={<TikTokIcon />} text="TikTok" />
            </div>
          </aside>
        </div>
      )}

      {activeImage && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/86 p-4 backdrop-blur-sm">
          <button type="button" className="absolute inset-0" aria-label={t('actions.close')} onClick={() => setActiveImage(null)} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute end-4 top-4 z-10 size-12 rounded-full bg-background/86 text-foreground hover:bg-background [&_svg]:!size-6"
            aria-label={t('actions.close')}
            onClick={() => setActiveImage(null)}
          >
            <X />
          </Button>
          <img src={activeImage} alt="" className="relative max-h-[88vh] max-w-[92vw] rounded-xl object-contain shadow-2xl" />
        </div>
      )}
    </main>
  )
}

function LessonsPage() {
  const { t } = useTranslation()

  return (
    <main className="min-h-screen bg-background px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 text-foreground sm:px-8 md:pb-10">
      <div className="mx-auto max-w-5xl">
        <a href="/" className="inline-flex text-sm font-semibold text-blush-strong underline-offset-4 hover:underline">
          {t('actions.back')}
        </a>

        <section className="mt-6 rounded-[1.8rem] bg-card/78 p-6 shadow-soft sm:p-8">
          <div className="grid gap-4 md:grid-cols-[0.75fr_1.25fr] md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blush-strong">{t('lessons.eyebrow')}</p>
              <h1 className="mt-2 font-serif text-4xl sm:text-5xl">{t('lessons.title')}</h1>
            </div>
            <div className="grid gap-2 text-base text-foreground/72 md:text-end">
              <p>{t('lessons.days')}</p>
              <p>{t('lessons.duration')}</p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.15rem] border border-blush/45">
            <div className="grid grid-cols-[1.2fr_0.75fr_0.8fr_1.2fr] bg-blush/35 text-sm font-bold md:text-base">
              <TableCell>{t('lessons.entry')}</TableCell>
              <TableCell>{t('lessons.count')}</TableCell>
              <TableCell>{t('lessons.price')}</TableCell>
              <TableCell>{t('lessons.validity')}</TableCell>
            </div>
            {lessonRows.map((row, index) => (
              <div key={`${row.count}-${row.price}`} className={`grid grid-cols-[1.2fr_0.75fr_0.8fr_1.2fr] ${index % 2 ? 'bg-background/32' : 'bg-card/35'}`}>
                <TableCell>{t(row.entry)}</TableCell>
                <TableCell>{row.count}</TableCell>
                <TableCell>{row.price}</TableCell>
                <TableCell>{t(row.validity)}</TableCell>
              </div>
            ))}
          </div>

          <div className="mt-7 grid gap-4 text-foreground/74 md:grid-cols-2">
            <ContactLine icon={<MapPin />} text={t('lessons.location')} />
            <ContactLine icon={<Phone />} text={t('lessons.phone')} />
          </div>
        </section>
      </div>
    </main>
  )
}

function SidebarLink({ href, onClick, children }: { href: string; onClick: () => void; children: ReactNode }) {
  return (
    <a href={href} className="border-b border-border/70 pb-4 text-foreground transition hover:text-blush-strong" onClick={onClick}>
      {children}
    </a>
  )
}

function PillLink({
  href,
  children,
  variant = 'solid',
  className = '',
}: {
  href: string
  children: ReactNode
  variant?: 'solid' | 'outline'
  className?: string
}) {
  return (
    <a
      href={href}
      className={`inline-flex h-12 items-center justify-center gap-5 rounded-full px-8 text-sm font-semibold uppercase tracking-[0.18em] transition ${
        variant === 'solid'
          ? 'bg-blush text-primary-foreground hover:bg-blush-strong'
          : 'border border-blush bg-transparent text-blush-strong hover:bg-blush/10'
      } ${className}`}
    >
      {children}
      <ArrowRight className="size-5" />
    </a>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="text-center">
      <h2 className="font-serif text-5xl leading-none">{children}</h2>
      <div className="mx-auto mt-2 h-0.5 w-28 bg-blush" />
    </div>
  )
}

function ServiceCard({ href, image, title, body, icon }: { href: string; image: string; title: string; body: string; icon: ReactNode }) {
  return (
    <a href={href} className="block overflow-hidden rounded-[1.3rem] bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-xl">
      <img src={image} alt="" className="h-64 w-full object-cover" />
      <div className="relative px-10 pb-8 pt-8">
        <div className="absolute -top-8 start-12 grid size-16 place-items-center rounded-full border-2 border-card bg-blush text-primary-foreground">
          {icon}
        </div>
        <h3 className="text-xl font-medium uppercase tracking-[0.08em]">{title}</h3>
        <p className="mt-2 max-w-xs text-sm leading-6 text-foreground/62">{body}</p>
      </div>
    </a>
  )
}

function TableCell({ children }: { children: ReactNode }) {
  return <div className="border-e border-t border-blush/45 px-3 py-3 text-center text-sm sm:px-4 sm:text-base">{children}</div>
}

function ContactLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <p className="flex items-center gap-4">
      <span className="text-blush-strong [&_svg]:size-5">{icon}</span>
      <span className="whitespace-pre-line">{text}</span>
    </p>
  )
}

function ContactLink({ href, icon, text }: { href: string; icon: ReactNode; text: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-4 transition hover:text-blush-strong">
      <span className="text-blush-strong [&_svg]:size-5">{icon}</span>
      <span>{text}</span>
    </a>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d="M14 4v10.2a4.2 4.2 0 1 1-4.2-4.2" />
      <path d="M14 4c.7 3.2 2.6 5 6 5.4" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M16.8 7.2h.01" />
    </svg>
  )
}
