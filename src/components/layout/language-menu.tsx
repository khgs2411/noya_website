import { Globe2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { languages, type LanguageCode } from '@/i18n'

type LanguageMenuProps = {
  buttonClassName?: string
  panelClassName?: string
}

export function LanguageMenu({ buttonClassName = '', panelClassName = '' }: LanguageMenuProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const currentLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0] as LanguageCode

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function handleLanguageChange(language: LanguageCode) {
    i18n.changeLanguage(language)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`rounded-full bg-blush/58 text-foreground hover:bg-blush/80 ${buttonClassName}`}
        aria-label={t('language.label')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Globe2 aria-hidden="true" />
      </Button>
      {open && (
        <div role="menu" className={`absolute end-0 top-14 z-[90] min-w-40 rounded-2xl border border-blush/40 bg-card/96 p-2 shadow-xl backdrop-blur ${panelClassName}`}>
          {languages.map((language) => (
            <button
              key={language.code}
              type="button"
              role="menuitemradio"
              aria-checked={currentLanguage === language.code}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-base text-card-foreground transition hover:bg-blush/18 hover:text-blush-strong"
              onClick={() => handleLanguageChange(language.code)}
            >
              <span>{language.label}</span>
              {currentLanguage === language.code && <span aria-hidden="true">•</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
