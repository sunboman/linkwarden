import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Link as LinkType } from '@/types'
import { ExternalLink, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { LinkCardMenu } from './LinkCardMenu'
import { EditLinkModal } from './EditLinkModal'

interface LinkCardProps {
  link: LinkType
}

export function LinkCard({ link }: LinkCardProps) {
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [primaryFailed, setPrimaryFailed] = useState(false)
  const hostname = new URL(link.url).hostname.replace('www.', '')

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

  return (
    <>
      <Link to={`/read/${link.id}`} className="link-card block relative group">
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
          
          {/* Menu button - top right corner */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <LinkCardMenu link={link} onEdit={() => setEditModalOpen(true)} />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          {/* Title */}
          <h3 className="font-medium text-base leading-tight line-clamp-2">
            {link.title || hostname}
          </h3>

          {/* Meta row */}
          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
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

            {/* Status indicator */}
            <span className="ml-auto flex items-center gap-1">
              {link.status === 'archived' && (
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              )}
              {link.status === 'failed' && (
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              )}
            </span>
          </div>

          {/* Tags */}
          {link.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {link.tags.slice(0, 3).map((tag) => (
                <span key={tag.id} className="tag-pill">
                  {tag.name}
                </span>
              ))}
              {link.tags.length > 3 && (
                <span className="tag-pill">+{link.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Reading progress */}
          {link.reading_progress > 0 && link.reading_progress < 1 && (
            <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${link.reading_progress * 100}%` }}
              />
            </div>
          )}
        </div>
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
