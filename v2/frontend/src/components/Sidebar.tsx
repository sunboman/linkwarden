import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  LayoutGrid, 
  Archive, 
  Hash, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Monitor
} from 'lucide-react'
import { api } from '@/lib/api'
import { useTheme } from '@/hooks/useTheme'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className = '' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true'
  })
  const navigate = useNavigate()
  const location = useLocation()
  const { themePreference, setTheme } = useTheme()

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: api.getTags,
  })

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString())
  }, [isCollapsed])

  // Get active filter from URL
  const params = new URLSearchParams(location.search)
  const isArchived = params.get('archived') === 'true'
  const activeTag = params.get('tag')
  const isLinksActive = location.pathname === '/' && !isArchived && !activeTag

  const navigateTo = (path: string) => {
    navigate(path)
  }

  const toggleTheme = () => {
    if (themePreference === 'light') setTheme('dark')
    else if (themePreference === 'dark') setTheme('system')
    else setTheme('light')
  }

  const ThemeIcon = themePreference === 'light' ? Sun : themePreference === 'dark' ? Moon : Monitor

  return (
    <aside 
      className={`h-screen sticky top-0 flex flex-col border-r border-neutral-200 dark:border-neutral-800 
                 bg-neutral-50/50 dark:bg-neutral-900/50 backdrop-blur-xl transition-all duration-300
                 ${isCollapsed ? 'w-16' : 'w-64'} ${className}`}
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800">
        {!isCollapsed && (
          <span className="font-semibold text-lg truncate">Linkwarden</span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ml-auto"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {/* Main Links */}
        <NavItem
          icon={LayoutGrid}
          label="All Links"
          isActive={isLinksActive}
          isCollapsed={isCollapsed}
          onClick={() => navigateTo('/')}
        />
        <NavItem
          icon={Archive}
          label="Archive"
          isActive={isArchived}
          isCollapsed={isCollapsed}
          onClick={() => navigateTo('/?archived=true')}
        />

        {/* Tags Section */}
        <div className="pt-4 pb-2">
          {!isCollapsed && (
            <p className="px-3 text-xs font-medium text-neutral-500 uppercase">Tags</p>
          )}
          <div className="mt-2 space-y-1">
            {tags.map((tag) => (
              <NavItem
                key={tag.id}
                icon={Hash}
                label={tag.name}
                isActive={activeTag === tag.name}
                isCollapsed={isCollapsed}
                onClick={() => navigateTo(`/?tag=${tag.name}`)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
        <NavItem
          icon={ThemeIcon}
          label={`Theme: ${themePreference}`}
          isCollapsed={isCollapsed}
          onClick={toggleTheme}
        />
        <NavItem
          icon={LogOut}
          label="Logout"
          isCollapsed={isCollapsed}
          onClick={() => {
            api.logout()
            window.location.reload()
          }}
          danger
        />
      </div>
    </aside>
  )
}

interface NavItemProps {
  icon: any
  label: string
  isActive?: boolean
  isCollapsed: boolean
  onClick: () => void
  danger?: boolean
}

function NavItem({ icon: Icon, label, isActive, isCollapsed, onClick, danger }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
                  : 'hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}
                ${danger && !isActive ? 'hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10' : ''}
                ${isCollapsed ? 'justify-center' : ''}
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
      
      {!isCollapsed && (
        <span className="truncate text-sm font-medium">{label}</span>
      )}
    </button>
  )
}
