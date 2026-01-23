import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Link as LinkType } from '@/types'
import { ExternalLink, Clock, AlertCircle } from 'lucide-react'
import { LinkCardMenu } from './LinkCardMenu'
import { EditLinkModal } from './EditLinkModal'

interface LinkCardProps {
  link: LinkType
}

export function LinkCard({ link }: LinkCardProps) {
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [primaryFailed, setPrimaryFailed] = useState(false)
  const [showAllTags, setShowAllTags] = useState(false)
  const tagsRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const hostname = new URL(link.url).hostname.replace('www.', '')

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagsRef.current && !tagsRef.current.contains(event.target as Node)) {
        setShowAllTags(false)
      }
    }

    if (showAllTags) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAllTags])

  // Helper to resolve image URL
  const getImageUrl = (path: string | null) => {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `/api/v1/files/${path}`
  }

  // Priority: OG image -> Screenshot -> Placeholder
  const primaryImage = getImageUrl(link.image_url)
  const fallbackImage = getImageUrl(link.screenshot_path)
  
  // Use primary unless it failed, then use fallback
  const currentSrc = (primaryImage && !primaryFailed) ? primaryImage : fallbackImage

  const handleTagClick = (e: React.MouseEvent, tagName: string) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`?tag=${encodeURIComponent(tagName)}`)
  }

  const handleExpandTags = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowAllTags(!showAllTags)
  }

  return (
    <>
      <Link to={`/read/${link.id}`} className="link-card block relative group flex flex-col overflow-visible">
        {/* Cover image - OG image with screenshot fallback */}
        <div className="aspect-[16/10] bg-neutral-200 dark:bg-neutral-700 rounded-xl mb-3 overflow-hidden relative">
          {currentSrc ? (
            <img
              key={`${link.id}-${primaryFailed}`}
              src={currentSrc}
              alt=""
              className="w-full h-full object-cover"
              onError={() => {
                if (!primaryFailed && fallbackImage) {
                  setPrimaryFailed(true)
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400">
              <ExternalLink className="w-8 h-8" />
            </div>
          )}
          
          {/* Status overlay for pending */}
          {link.status === 'pending' && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="flex items-center gap-2 text-white text-sm">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Saving...</span>
              </div>
            </div>
          )}
          
          {/* Failed indicator - top right corner */}
          {link.status === 'failed' && (
            <div className="absolute top-2 right-2 bg-red-500/90 rounded-full p-1 shadow-sm backdrop-blur-sm z-10" title="Archiving failed">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
          )}
          
          {/* Menu button - top right corner (offset if failed) */}
          <div className={`absolute top-2 ${link.status === 'failed' ? 'right-9' : 'right-2'} opacity-0 group-hover:opacity-100 transition-opacity`}>
            <LinkCardMenu link={link} onEdit={() => setEditModalOpen(true)} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Title */}
          <h3 className="font-medium text-base leading-tight line-clamp-2">
            {link.title || hostname}
          </h3>

          {/* Meta row */}
          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mt-2">
            {/* Favicon */}
            {link.favicon_url && (
              <img
                src={link.favicon_url}
                alt=""
                className="w-4 h-4 rounded"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            )}
            <span className="truncate">{hostname}</span>

            {/* Status indicator & Date */}
            <span className="ml-auto flex items-center gap-2">
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                {new Date(link.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </span>
          </div>

          {/* Tags */}
          {link.tags.length > 0 && (
            <div ref={tagsRef} className="relative mt-2 pr-2 overflow-visible">
              <div className="flex flex-wrap gap-1">
                {link.tags.slice(0, 3).map((tag) => (
                  <button
                    key={tag.id}
                    onClick={(e) => handleTagClick(e, tag.name)}
                    className="tag-pill hover:bg-neutral-300/60 dark:hover:bg-neutral-600/60 transition-colors cursor-pointer"
                  >
                    {tag.name}
                  </button>
                ))}
                {link.tags.length > 3 && (
                  <button
                    onClick={handleExpandTags}
                    className="tag-pill hover:bg-neutral-300/60 dark:hover:bg-neutral-600/60 transition-colors cursor-pointer"
                  >
                    +{link.tags.length - 3}
                  </button>
                )}
              </div>

              {/* Expanded tags dropdown */}
              {showAllTags && link.tags.length > 3 && (
                <div 
                  className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-2 min-w-[150px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-wrap gap-1">
                    {link.tags.slice(3).map((tag) => (
                      <button
                        key={tag.id}
                        onClick={(e) => handleTagClick(e, tag.name)}
                        className="tag-pill hover:bg-neutral-300/60 dark:hover:bg-neutral-600/60 transition-colors cursor-pointer"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reading progress */}
        {(link.reading_progress || 0) > 0 && (
          <div className="mt-3 w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden shrink-0">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${Math.min(link.reading_progress || 0, 100)}%` }}
            />
          </div>
        )}
      </Link>

      {/* Edit Modal */}
      <EditLinkModal
        link={link}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
      />
    </>
  )
}
