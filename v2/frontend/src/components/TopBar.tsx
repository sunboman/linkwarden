import { useState, useRef, useEffect } from 'react'
import { Moon, Sun, Monitor, Search } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { useLocation, useNavigate } from 'react-router-dom'

export function TopBar() {
  const { setTheme, themePreference } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Search state
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

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

  // Update search query when URL changes
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '')
  }, [location.search])

  const handleSearch = (term: string) => {
    setSearchQuery(term)
    // Debounce ideally, but direct navigation for now or useEffect debounce approach? 
    // Let's just update local state here and maybe trigger search on Enter or debounce.
    // For simplicity, let's update URL on Enter or debounce. 
    // Implementing debounce here simply:
  }
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
        const currentSearch = searchParams.get('search') || ''
        if (searchQuery !== currentSearch) {
            if (searchQuery) {
                searchParams.set('search', searchQuery)
            } else {
                searchParams.delete('search')
            }
            // Keep other params like tag/archived
            navigate(`?${searchParams.toString()}`, { replace: true })
        }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'Auto', icon: Monitor },
  ]

  const currentOption = themeOptions.find(opt => opt.value === themePreference) || themeOptions[2]
  const CurrentIcon = currentOption.icon

  return (
    <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-20">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-neutral-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search links..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-neutral-800 
                     border border-neutral-200 dark:border-neutral-700
                     focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Theme Toggle */}
      <div className="ml-4 relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-10 h-10 rounded-xl 
                     hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Theme"
        >
          <CurrentIcon className="w-5 h-5" />
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
                            ${isSelected ? 'text-primary' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                  {isSelected && (
                    <span className="ml-auto text-primary">✓</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
