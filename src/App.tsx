import { ArrowRight, AtSign, Mail, MapPin, Menu, Moon, Star, Sun, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { LanguageMenu } from '@/components/layout/language-menu'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'

const images = {
  hero: '/images/9D661F78-FE6E-4ECF-960D-8FE8C888CB91.jpeg',
  portrait: '/images/976EFAC9-76C5-4B1A-AD92-F6A051E7CC31.jpeg',
  leap: '/images/IMG_2109.jpeg',
  leapWide: '/images/IMG_2101.jpeg',
  private: '/images/IMG_2105.jpeg',
  rehearsal: '/images/3f126190-c261-48b2-9c94-d6c20c94365b.jpeg',
  group: '/images/750f785f-80db-4158-825b-c5f7ff958837.jpeg',
}

const classes = [
  { date: '24', title: 'classes.flow', time: 'classes.flowTime', image: images.leap },
  { date: '27', title: 'classes.lines', time: 'classes.linesTime', image: images.rehearsal },
  { date: '29', title: 'classes.jazz', time: 'classes.jazzTime', image: images.group },
]

const gallery = [images.hero, images.portrait, images.leap, images.private, images.rehearsal, images.group]

export default function App() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section id="top" className="hero-shell relative overflow-hidden">
        <div className="absolute end-0 top-0 h-[48rem] w-[52%] max-w-[46rem] overflow-hidden max-md:opacity-28">
          <img src={images.hero} alt="" className="size-full object-cover object-[52%_18%] grayscale" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/18 to-transparent" />
          <div className="absolute inset-y-0 start-0 w-28 bg-gradient-to-r from-background to-transparent" />
        </div>

        <header className="relative z-10 mx-auto flex max-w-6xl items-start justify-between px-5 py-5 sm:px-8">
          <a href="#top" className="leading-none">
            <span className="font-script block text-5xl text-foreground sm:text-6xl">{t('brand.first')}</span>
            <span className="ms-10 block text-xs font-semibold tracking-[0.58em] text-foreground/70">{t('brand.second')}</span>
          </a>
          <div className="flex items-center gap-2">
            <LanguageMenu />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 rounded-full bg-blush/70 text-foreground hover:bg-blush"
              aria-label={t('theme.toggle')}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Moon /> : <Sun />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-14 rounded-full bg-blush text-foreground hover:bg-blush/80"
              aria-label={t('menu.toggle')}
            >
              <Menu className="size-7" />
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
              <PillLink href="#classes">{t('hero.classes')}</PillLink>
              <PillLink href="#contact" variant="outline">
                {t('hero.private')}
              </PillLink>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="relative mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        <img src={images.portrait} alt="" className="h-80 w-full rounded-[1.65rem] object-cover grayscale md:h-[21rem]" />
        <div className="relative overflow-hidden rounded-[1.8rem] bg-card/62 p-8 shadow-soft">
          <div className="floral-mark" aria-hidden="true" />
          <h2 className="font-serif text-5xl leading-none">
            {t('about.title')}{' '}
            <span className="font-script text-6xl font-normal text-blush-strong">{t('brand.first')}</span>
          </h2>
          <div className="mt-4 h-0.5 w-28 bg-blush" />
          <p className="mt-6 max-w-sm whitespace-pre-line text-base leading-6 text-foreground/72">{t('about.body')}</p>
          <PillLink href="#work" className="mt-7 max-w-56">
            {t('about.cta')}
          </PillLink>
        </div>
      </section>

      <section id="work" className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
        <SectionTitle>{t('services.title')}</SectionTitle>
        <div className="mt-5 grid gap-8 md:grid-cols-2">
          <ServiceCard icon={<Users />} image={images.leap} title={t('services.classes')} body={t('services.classesBody')} />
          <ServiceCard icon={<Star />} image={images.private} title={t('services.private')} body={t('services.privateBody')} />
        </div>
      </section>

      <section id="classes" className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-serif text-4xl sm:text-5xl">{t('classes.title')}</h2>
          <PillLink href="#contact" variant="outline" className="hidden min-w-48 sm:flex">
            {t('classes.viewAll')}
          </PillLink>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {classes.map((item) => (
            <article key={item.date} className="overflow-hidden rounded-[1.1rem] bg-card shadow-soft">
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
            </article>
          ))}
        </div>
      </section>

      <section className="bg-muted/50 py-7">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <h2 className="font-serif text-4xl sm:text-5xl">{t('gallery.title')}</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {gallery.map((image, index) => (
              <img key={`${image}-${index}`} src={image} alt="" className="h-28 w-full rounded-xl object-cover grayscale" />
            ))}
          </div>
        </div>
      </section>

      <footer id="contact" className="mx-auto max-w-6xl px-5 pb-0 pt-5 sm:px-8">
        <div className="relative grid gap-6 overflow-hidden rounded-[1.35rem] border border-blush/55 bg-card/80 p-6 md:grid-cols-[1fr_1fr]">
          <div className="floral-mark floral-mark-start" aria-hidden="true" />
          <div>
            <h2 className="font-serif text-4xl">{t('contact.title')}</h2>
            <p className="mt-2 max-w-sm text-sm leading-5 text-foreground/62">{t('contact.body')}</p>
            <PillLink href="mailto:hello@noyadance.com" className="mt-4 max-w-52">
              {t('contact.cta')}
            </PillLink>
          </div>
          <div className="grid gap-3 text-sm text-foreground/74">
            <ContactLine icon={<Mail />} text="hello@noyadance.com" />
            <ContactLine icon={<AtSign />} text="@noya.dance" />
            <ContactLine icon={<MapPin />} text={t('contact.location')} />
          </div>
        </div>
        <div className="mt-5 bg-blush px-4 py-2 text-center text-xs text-primary-foreground">{t('footer')}</div>
      </footer>
    </main>
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

function ServiceCard({ image, title, body, icon }: { image: string; title: string; body: string; icon: ReactNode }) {
  return (
    <article className="overflow-hidden rounded-[1.3rem] bg-card shadow-soft">
      <img src={image} alt="" className="h-64 w-full object-cover" />
      <div className="relative px-10 pb-8 pt-8">
        <div className="absolute -top-8 start-12 grid size-16 place-items-center rounded-full border-2 border-card bg-blush text-primary-foreground">
          {icon}
        </div>
        <h3 className="text-xl font-medium uppercase tracking-[0.08em]">{title}</h3>
        <p className="mt-2 max-w-xs text-sm leading-6 text-foreground/62">{body}</p>
      </div>
    </article>
  )
}

function ContactLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <p className="flex items-center gap-4">
      <span className="text-blush-strong [&_svg]:size-5">{icon}</span>
      <span>{text}</span>
    </p>
  )
}
