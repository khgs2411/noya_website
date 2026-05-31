import { Globe2 } from 'lucide-react'
import { useState } from 'react'
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
  const currentLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0] as LanguageCode

  function handleLanguageChange(language: LanguageCode) {
    i18n.changeLanguage(language)
    setOpen(false)
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`rounded-full bg-blush/58 text-foreground hover:bg-blush/80 ${buttonClassName}`}
        aria-label={t('language.label')}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Globe2 />
      </Button>
      {open && (
        <div className={`absolute end-0 top-14 z-[90] min-w-40 rounded-2xl border border-blush/40 bg-card/96 p-2 shadow-xl backdrop-blur ${panelClassName}`}>
          {languages.map((language) => (
            <button
              key={language.code}
              type="button"
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
