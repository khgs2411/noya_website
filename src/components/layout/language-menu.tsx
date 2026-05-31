import { Globe2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { languages, type LanguageCode } from '@/i18n'

export function LanguageMenu() {
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
        className="size-10 rounded-full"
        aria-label={t('language.label')}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Globe2 />
      </Button>
      {open && (
        <div className="absolute end-0 top-12 z-50 min-w-36 rounded-md border border-border bg-card p-1 shadow-xl">
          {languages.map((language) => (
            <button
              key={language.code}
              type="button"
              className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm text-card-foreground hover:bg-accent hover:text-accent-foreground"
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
