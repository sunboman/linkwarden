import { useState, useRef, useEffect } from 'react'
import { Moon, Sun, Monitor, ChevronDown } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme.tsx'

export function Navbar() {
  const { theme, setTheme, themePreference } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'Auto', icon: Monitor },
  ]

  const currentOption = themeOptions.find(opt => opt.value === themePreference) || themeOptions[2]
  const CurrentIcon = currentOption.icon

  return (
    <nav className="glass-nav h-16 flex items-center justify-between px-4">
      <h1 className="text-lg font-semibold">Linkwarden</h1>
      
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl 
                     hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <CurrentIcon className="w-4 h-4" />
          <span className="text-sm">{currentOption.label}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-36 py-1 glass-card shadow-lg z-50">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const isSelected = option.value === themePreference
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm
                            hover:bg-black/5 dark:hover:bg-white/10 transition-colors
                            ${isSelected ? 'text-blue-500' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                  {isSelected && (
                    <span className="ml-auto text-blue-500">✓</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
