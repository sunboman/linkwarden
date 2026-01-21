import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  Link2, 
  Archive, 
  Hash, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Plus
} from 'lucide-react'
import { api } from '@/lib/api'
import { AddLinkModal } from './AddLinkModal'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className = '' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true'
  })
  const navigate = useNavigate()
  const location = useLocation()

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: api.getTags,
  })

  // Fetch all links count
  const { data: allLinksData } = useQuery({
    queryKey: ['links', { limit: 1 }], // Just need the count
    queryFn: () => api.getLinks(0),
  })

  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false)

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



  return (
    <aside 
      className={`h-screen sticky top-0 flex flex-col border-r border-neutral-200 dark:border-neutral-800 
                 bg-neutral-50/50 dark:bg-neutral-900/50 backdrop-blur-xl transition-all duration-300
                 ${isCollapsed ? 'w-16' : 'w-64'} ${className}`}
    >
      {/* Header / Logo */}
      <div className={`h-16 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 ${isCollapsed ? 'px-2 flex-col justify-center gap-1' : 'px-4'}`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <img 
              src="/icon.png" 
              alt="M" 
              className="h-8 w-auto object-contain"
            />
            <span className="font-semibold text-lg truncate">Michi-reader</span>
          </div>
        ) : (
          <img 
            src="/icon.png" 
            alt="M" 
            className="h-6 w-auto object-contain mx-auto"
          />
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ${!isCollapsed ? 'ml-auto' : 'mx-auto w-full flex justify-center'}`}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Add Link Button (Gmail Compose Style) */}
      <div className={`p-4 pb-2 ${isCollapsed ? 'px-2' : ''}`}>
        <button
          onClick={() => setIsAddLinkOpen(true)}
          className={`
            flex items-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl
            ${isCollapsed 
              ? 'w-10 h-10 justify-center rounded-xl bg-sky-200 text-sky-900 hover:bg-sky-300 dark:bg-sky-300 dark:text-sky-950 mx-auto' 
              : 'w-fit px-6 py-4 rounded-2xl bg-sky-200 text-sky-900 hover:bg-sky-300 dark:bg-sky-300 dark:text-sky-950'}
          `}
        >
          <Plus className="w-6 h-6" />
          {!isCollapsed && <span className="font-semibold">Add Link</span>}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {/* Main Links */}
        <NavItem
          icon={Link2}
          label="All Links"
          isActive={isLinksActive}
          isCollapsed={isCollapsed}
          onClick={() => navigateTo('/')}
          count={allLinksData?.total}
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
            <div className="flex items-center justify-between px-3 mb-2">
               <p className="text-xs font-medium text-neutral-500 uppercase">Tags</p>
            </div>
          )}
          <div className="space-y-1">
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

      <AddLinkModal isOpen={isAddLinkOpen} onClose={() => setIsAddLinkOpen(false)} />
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
  className?: string
  activeClassName?: string
  count?: number
}

function NavItem({ icon: Icon, label, isActive, isCollapsed, onClick, danger, className, activeClassName, count }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-r-full transition-all duration-200 mr-2
                ${isActive 
                  ? (activeClassName || 'bg-neutral-200 dark:bg-neutral-800 text-primary font-semibold') 
                  : (className || 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400')}
                ${danger && !isActive ? 'hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10' : ''}
                ${isCollapsed ? 'justify-center px-0 rounded-xl mx-auto w-10 h-10' : ''}
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0`} />
      
      {!isCollapsed && (
        <>
          <span className="truncate text-sm flex-1 text-left">{label}</span>
          {count !== undefined && (
            <span className="text-xs font-medium opacity-70">{count}</span>
          )}
        </>
      )}
    </button>
  )
}
