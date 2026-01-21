import { Link } from 'react-router-dom'
import type { Link as LinkType } from '@/types'
import { ExternalLink, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface LinkCardProps {
  link: LinkType
}

export function LinkCard({ link }: LinkCardProps) {
  const hostname = new URL(link.url).hostname.replace('www.', '')

  return (
    <Link to={`/read/${link.id}`} className="link-card block">
      {/* Cover image - OG image with screenshot fallback */}
      <div className="aspect-[16/10] bg-neutral-200 dark:bg-neutral-700 rounded-xl mb-3 overflow-hidden">
        {(link.image_url || link.screenshot_path) ? (
          <img
            src={link.image_url || `/api/v1/files/${link.screenshot_path}`}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            <ExternalLink className="w-8 h-8" />
          </div>
        )}
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
            {link.status === 'pending' && (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs">Saving...</span>
              </>
            )}
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
  )
}
