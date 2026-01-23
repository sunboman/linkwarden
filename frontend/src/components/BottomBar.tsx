import { useState } from 'react'
import { Link2, Archive, Hash, X } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function BottomBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isTagsOpen, setIsTagsOpen] = useState(false)
  
  // Get active filter from URL
  const params = new URLSearchParams(location.search)
  const isArchived = params.get('archived') === 'true'
  const activeTag = params.get('tag')
  const isLinksActive = location.pathname === '/' && !isArchived && !activeTag

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: api.getTags,
  })

  const navigateTo = (path: string) => {
    navigate(path)
    setIsTagsOpen(false)
  }

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 box-content bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-around z-50 pb-safe">
        <NavItem
          icon={Link2}
          label="Links"
          isActive={isLinksActive}
          onClick={() => navigateTo('/')}
        />
        <NavItem
          icon={Archive}
          label="Archive"
          isActive={isArchived}
          onClick={() => navigateTo('/?archived=true')}
        />
        <NavItem
          icon={Hash}
          label="Tags"
          isActive={!!activeTag || isTagsOpen}
          onClick={() => setIsTagsOpen(true)}
        />
      </div>

      {/* Tags Drawer/Overlay */}
      {isTagsOpen && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-neutral-900 flex flex-col animate-in slide-in-from-bottom-10 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="font-semibold text-lg">Tags</h2>
            <button 
              onClick={() => setIsTagsOpen(false)}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 gap-1">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => navigateTo(`/?tag=${tag.name}`)}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors
                    ${activeTag === tag.name 
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-primary font-medium' 
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400'}`}
                >
                  <Hash className="w-4 h-4" />
                  <span className="flex-1">{tag.name}</span>
                  {activeTag === tag.name && <span className="text-primary">✓</span>}
                </button>
              ))}
              {tags.length === 0 && (
                <div className="text-center py-10 text-neutral-500">
                  No tags found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface NavItemProps {
  icon: any
  label: string
  isActive?: boolean
  onClick: () => void
}

function NavItem({ icon: Icon, label, isActive, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all duration-200 space-y-1
                ${isActive 
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-primary font-semibold' 
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'}`}
    >
      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}
