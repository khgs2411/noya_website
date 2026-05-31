import { ArrowUpRight, Moon, Sparkles, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LanguageMenu } from '@/components/layout/language-menu'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'

const workCards = [
  { title: 'work.performance', body: 'work.performanceBody' },
  { title: 'work.classes', body: 'work.classesBody' },
  { title: 'work.creation', body: 'work.creationBody' },
]

const galleryItems = ['gallery.itemOne', 'gallery.itemTwo', 'gallery.itemThree']

export default function App() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/82 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="text-sm font-semibold tracking-[0.24em] uppercase">
            {t('brand')}
          </a>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#about" className="hover:text-foreground">
              {t('nav.about')}
            </a>
            <a href="#work" className="hover:text-foreground">
              {t('nav.work')}
            </a>
            <a href="#classes" className="hover:text-foreground">
              {t('nav.classes')}
            </a>
            <a href="#contact" className="hover:text-foreground">
              {t('nav.contact')}
            </a>
          </nav>
          <div className="flex items-center gap-1">
            <LanguageMenu />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 rounded-full"
              aria-label={t('theme.toggle')}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Moon /> : <Sun />}
            </Button>
          </div>
        </div>
      </header>

      <section id="top" className="mx-auto grid max-w-5xl gap-10 px-4 pb-16 pt-8 sm:px-6 md:grid-cols-[1fr_0.88fr] md:items-end md:pt-12">
        <div className="relative min-h-[72vh] overflow-hidden rounded-md border border-border bg-muted md:min-h-[760px]">
          <img
            src="/dancer-hero.png"
            alt=""
            className="absolute inset-0 size-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/68" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-white/76">
              <Sparkles className="size-3.5" />
              {t('hero.eyebrow')}
            </p>
            <h1 className="max-w-xl text-4xl font-semibold leading-[0.96] tracking-normal sm:text-6xl">
              {t('hero.title')}
            </h1>
          </div>
        </div>

        <div className="space-y-8 md:pb-10">
          <p className="max-w-md text-lg leading-8 text-muted-foreground">{t('hero.body')}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <a href="#contact">
                {t('hero.primary')}
                <ArrowUpRight />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#work">{t('hero.secondary')}</a>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3 border-y border-border py-5">
            <Stat value="8+" label={t('stats.years')} />
            <Stat value="4" label={t('stats.forms')} />
            <Stat value="3" label={t('stats.cities')} />
          </div>
        </div>
      </section>

      <section id="about" className="border-y border-border bg-secondary/45">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-[0.8fr_1.2fr]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{t('about.eyebrow')}</p>
          <div className="space-y-5">
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">{t('about.title')}</h2>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">{t('about.body')}</p>
          </div>
        </div>
      </section>

      <section id="work" className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="mb-6 text-3xl font-semibold">{t('work.title')}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {workCards.map((card) => (
            <article key={card.title} className="rounded-md border border-border bg-card p-5">
              <p className="mb-8 text-xs font-semibold uppercase tracking-[0.22em] text-accent-foreground">0{workCards.indexOf(card) + 1}</p>
              <h3 className="text-xl font-semibold">{t(card.title)}</h3>
              <p className="mt-3 leading-7 text-muted-foreground">{t(card.body)}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="classes" className="mx-auto max-w-5xl px-4 pb-14 sm:px-6">
        <h2 className="mb-6 text-3xl font-semibold">{t('gallery.title')}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {galleryItems.map((item, index) => (
            <div key={item} className="flex aspect-[4/5] items-end rounded-md border border-border bg-muted p-4">
              <span className="text-sm font-medium text-muted-foreground">{t(item)}</span>
              <span className="ms-auto text-5xl font-semibold text-border">0{index + 1}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <div className="grid gap-6 rounded-md bg-primary p-6 text-primary-foreground sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="max-w-xl text-3xl font-semibold leading-tight">{t('contact.title')}</h2>
              <p className="mt-4 max-w-2xl leading-7 text-primary-foreground/72">{t('contact.body')}</p>
            </div>
            <Button variant="secondary" size="lg" asChild>
              <a href="mailto:hello@example.com">
                {t('contact.cta')}
                <ArrowUpRight />
              </a>
            </Button>
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">{t('footer')}</p>
        </div>
      </section>
    </main>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{label}</p>
    </div>
  )
}
