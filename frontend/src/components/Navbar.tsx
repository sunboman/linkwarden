import { useState, useRef, useEffect } from 'react'
import { Moon, Sun, Monitor, Search, ArrowUpDown, Calendar, Clock } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme.tsx'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sort } from '@/types'

const SORT_STORAGE_KEY = 'michireader-sort'

function getSavedSort(): Sort {
  const saved = localStorage.getItem(SORT_STORAGE_KEY)
  if (saved !== null) {
    const parsed = Number(saved)
    if (Object.values(Sort).includes(parsed)) {
      return parsed as Sort
    }
  }
  return Sort.LastReadNewestFirst
}

export function Navbar() {
  const { setTheme, themePreference } = useTheme()
  const [isThemeOpen, setIsThemeOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const themeDropdownRef = useRef<HTMLDivElement>(null)
  const sortDropdownRef = useRef<HTMLDivElement>(null)
  
  // Search state
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  
  // Sort state
  const urlSort = searchParams.get('sort')
  const [sort, setSort] = useState<Sort>(() => {
    if (urlSort !== null) {
      const parsed = Number(urlSort)
      if (Object.values(Sort).includes(parsed)) return parsed as Sort
    }
    return getSavedSort()
  })

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false)
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortOpen(false)
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
            navigate(`?${searchParams.toString()}`, { replace: true })
        }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Handle sort change
  const handleSortChange = (newSort: Sort) => {
    setSort(newSort)
    localStorage.setItem(SORT_STORAGE_KEY, newSort.toString())
    searchParams.set('sort', newSort.toString())
    navigate(`?${searchParams.toString()}`, { replace: true })
    setIsSortOpen(false)
  }

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'Auto', icon: Monitor },
  ]

  const sortOptions = [
    { value: Sort.DateNewestFirst, label: 'Date (Newest)', icon: Calendar },
    { value: Sort.DateOldestFirst, label: 'Date (Oldest)', icon: Calendar },
    { value: Sort.LastReadNewestFirst, label: 'Last Read (Newest)', icon: Clock },
    { value: Sort.LastReadOldestFirst, label: 'Last Read (Oldest)', icon: Clock },
  ]

  const currentTheme = themeOptions.find(opt => opt.value === themePreference) || themeOptions[2]
  const CurrentThemeIcon = currentTheme.icon

  return (
    <nav className="h-16 flex items-center justify-between px-4 gap-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 backdrop-blur-md">
      {/* 1. Icon on the Left */}
      <img 
        src="/icon.png" 
        alt="Logo" 
        className="h-8 w-8 object-contain flex-shrink-0"
      />
      
      {/* 2. Search Input in the Middle */}
      <div className="flex-1 relative max-w-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-neutral-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search..."
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm
                     bg-neutral-100 dark:bg-neutral-800 
                     border border-neutral-200 dark:border-neutral-700
                     focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* 3. Sort and Theme on the Right */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Sort Toggle */}
        <div className="relative" ref={sortDropdownRef}>
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-xl 
                       hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Sort"
          >
            <ArrowUpDown className="w-5 h-5" />
          </button>

          {isSortOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 py-1 glass-card shadow-lg z-50">
              {sortOptions.map((option) => {
                const Icon = option.icon
                const isSelected = option.value === sort
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
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

        {/* Theme Toggle */}
        <div className="relative" ref={themeDropdownRef}>
          <button
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-xl 
                       hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Theme"
          >
            <CurrentThemeIcon className="w-5 h-5" />
          </button>

          {isThemeOpen && (
            <div className="absolute right-0 top-full mt-2 w-36 py-1 glass-card shadow-lg z-50">
              {themeOptions.map((option) => {
                const Icon = option.icon
                const isSelected = option.value === themePreference
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTheme(option.value)
                      setIsThemeOpen(false)
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
    </nav>
  )
}
