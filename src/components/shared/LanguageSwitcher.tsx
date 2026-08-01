'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { LANGUAGES } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronDown } from 'lucide-react'

export function LanguageSwitcher() {
  const { lang, setLang } = useAppStore()
  const [open, setOpen] = useState(false)
  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs font-medium text-[var(--navy)] dark:text-white hover:bg-muted"
        >
          <span className="text-sm leading-none">{current.flag}</span>
          <span className="hidden sm:inline">{current.label}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => {
              setLang(l.code)
              setOpen(false)
            }}
            className={
              'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors text-left' +
              (lang === l.code
                ? ' bg-[var(--gold)]/15 font-semibold text-[var(--navy)] dark:text-[var(--gold)]'
                : ' hover:bg-muted text-foreground')
            }
          >
            <span className="text-base leading-none">{l.flag}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-tight">{l.native}</p>
              <p className="text-[11px] text-muted-foreground">{l.label}</p>
            </div>
            {lang === l.code && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" />
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
