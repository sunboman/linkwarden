
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ArrowLeft, ExternalLink, Archive, Loader2, Trash2, List } from 'lucide-react'
import { ReaderFormatOptions, type ReaderSettings } from '@/components/ReaderFormatOptions'
import {  ReaderSelectionMenu } from '@/components/ReaderSelectionMenu'
import { ReaderHighlightsList } from '@/components/ReaderHighlightsList'
import { HighlightPopover } from '@/components/HighlightPopover'
import { useTheme } from '@/hooks/useTheme'

export function ReaderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const lastScrollTop = useRef(0)
  const touchStart = useRef<{x: number, y: number} | null>(null)
  const isMenuInteractingRef = useRef(false)
  const [showNavbar, setShowNavbar] = useState(true)
  const { setTheme, themePreference } = useTheme()
  
  // Selection State - stores position relative to container (not viewport)
  const [selectionPos, setSelectionPos] = useState<{ top: number; left: number } | null>(null)
  const [tempHighlightRects, setTempHighlightRects] = useState<{ top: number; left: number; width: number; height: number }[]>([])

  // Clear temp highlights when menu closes
  useEffect(() => {
    if (!selectionPos) setTempHighlightRects([])
  }, [selectionPos])
  const containerRef = useRef<HTMLDivElement>(null)

  // Reader Settings
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const saved = localStorage.getItem('reader-settings')
    const defaults: ReaderSettings = { font: 'sans', fontSize: 100, lineHeight: 1.6, lineWidth: 'normal', theme: themePreference }
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults
  })

  // ... effects ...
  
  const getFontClass = () => {
    switch (settings.font) {
        case 'serif': case 'lora': return 'font-serif'
        case 'mono': return 'font-mono'
        case 'inter': return 'font-sans' 
        default: return 'font-sans'
    }
  }

  const getWidthClass = () => {
      switch(settings.lineWidth) {
          case 'narrow': return 'max-w-xl'
          case 'wide': return 'max-w-5xl'
          default: return 'max-w-3xl' // Normal
      }
  }

  useEffect(() => {
    localStorage.setItem('reader-settings', JSON.stringify(settings))
    if (settings.theme !== themePreference) {
        setTheme(settings.theme)
    }
  }, [settings, setTheme, themePreference])

  useEffect(() => {
      setSettings(prev => prev.theme !== themePreference ? { ...prev, theme: themePreference } : prev)
  }, [themePreference])


  const { data: link, isLoading, error } = useQuery({
    queryKey: ['link', id],
    queryFn: () => api.getLink(Number(id)),
    enabled: !!id,
  })

  const updateContentMutation = useMutation({
    mutationFn: (newContent: string) => api.updateLink(Number(id), { content: newContent }),
    onMutate: async (newContent) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['link', id] })
      
      // Snapshot previous value
      const previousLink = queryClient.getQueryData(['link', id])
      
      // Optimistically update cache
      queryClient.setQueryData(['link', id], (old: any) => ({
        ...old,
        content: newContent
      }))
      
      return { previousLink }
    },
    onError: (_err, _newContent, context) => {
      // Rollback on error
      if (context?.previousLink) {
        queryClient.setQueryData(['link', id], context.previousLink)
      }
    },
    onSettled: () => {
      // Don't invalidate immediately - the cache is already up to date
      // Optionally refetch in background after a delay
    },
  })
  
  // Workaround for Partial<Link> type if 'content' is not in Update schema? 
  // Warning: Schema LinkUpdate in backend might default params. 
  // Step 1644 showed LinkUpdate has title, description, is_archived, reading_progress, tags. 
  // It MISSES 'content'. 
  // I need to update backend schema to allow updating content if I want to persist highlights!
  // I'll proceed keeping this in mind.

  const archiveMutation = useMutation({
    mutationFn: () => api.updateLink(Number(id), { is_archived: !link?.is_archived }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      queryClient.invalidateQueries({ queryKey: ['link', id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteLink(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      navigate('/')
    },
  })

  // Handle Selection on mouse up (like v1)
  const handleMouseUp = (e: React.MouseEvent) => {
      // If interacting with menu (e.g. typing comment), ignore
      if (isMenuInteractingRef.current) return
      
      // Don't handle if clicking on a highlight
      const target = e.target as HTMLElement
      if (target.closest('.highlight')) return
      
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !contentRef.current?.contains(selection.anchorNode)) {
          return
      }
      
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()
      
      if (!containerRect) return
      
      // Only show if selection is inside article
      if (contentRef.current.contains(range.commonAncestorContainer)) {
           // Clone range to preserve it
           selectedRangeRef.current = range.cloneRange()
           // Store position RELATIVE to container (for absolute positioning)
           const relativeX = rect.left - containerRect.left + rect.width / 2
           const relativeY = rect.top - containerRect.top
           setSelectionPos({ top: relativeY, left: relativeX })
      }
  }

  // Highlights List toggle
  const [showHighlights, setShowHighlights] = useState(false)
  const selectedRangeRef = useRef<Range | null>(null)
  
  // Active highlight popover state
  const [activeHighlight, setActiveHighlight] = useState<{ id: string; comment?: string; rect: DOMRect } | null>(null)

  const handleHighlight = async (color: string, comment?: string, isAnnotation?: boolean) => {
      // Use stored range
      const range = selectedRangeRef.current
      if (!range) return

      const span = document.createElement('span')
      
      let bgClass = ''
      if (isAnnotation) {
          // Annotation style: yellow background + underline
          bgClass = 'bg-yellow-200/50 dark:bg-yellow-500/30 underline decoration-2 decoration-yellow-600 dark:decoration-yellow-400'
      } else {
          switch(color) {
              case 'yellow': bgClass = 'bg-yellow-200/50 dark:bg-yellow-500/30'; break;
              case 'green': bgClass = 'bg-green-200/50 dark:bg-green-500/30'; break;
              case 'red': bgClass = 'bg-red-200/50 dark:bg-red-500/30'; break;
              case 'blue': bgClass = 'bg-blue-200/50 dark:bg-blue-500/30'; break;
          }
      }
      
      const hlId = `hl-${Date.now()}`
      span.className = `highlight ${bgClass} rounded-sm px-0.5 cursor-pointer`
      span.dataset.highlight = 'true'
      span.id = hlId
      if (comment) span.dataset.comment = comment
      if (isAnnotation) span.dataset.annotation = 'true'
      
      try {
          range.surroundContents(span)
          window.getSelection()?.removeAllRanges()
          
          setSelectionPos(null)
          selectedRangeRef.current = null
          isMenuInteractingRef.current = false
          
          // Persist
          if (contentRef.current) {
             updateContentMutation.mutate(contentRef.current.innerHTML) 
          }
      } catch (e) {
          console.error("Highlight failed", e)
      }
  }

  const handleDeleteHighlight = (id: string) => {
      const el = document.getElementById(id)
      if (!el || !contentRef.current) return
      
      // Preserve the text content
      const text = el.textContent || ''
      const textNode = document.createTextNode(text)
      el.parentNode?.replaceChild(textNode, el)
      
      // Persist
      updateContentMutation.mutate(contentRef.current.innerHTML)
  }

  // Handle clicks on existing highlights
  const handleArticleClick = (e: React.MouseEvent) => {
      // Don't interfere if user has text selected
      const selection = window.getSelection()
      if (selection && !selection.isCollapsed) return
      
      const target = e.target as HTMLElement
      const highlightEl = target.closest('.highlight') as HTMLElement
      
      if (highlightEl && highlightEl.dataset.highlight) {
          const rect = highlightEl.getBoundingClientRect()
          setActiveHighlight({
              id: highlightEl.id,
              comment: highlightEl.dataset.comment,
              rect
          })
      }
  }

  const handleJumpToHighlight = (id: string) => {
      setShowHighlights(false)
      setTimeout(() => {
          const el = document.getElementById(id)
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
              el.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
              setTimeout(() => {
                  el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
              }, 2000)
          }
      }, 300)
  }


  // Hide navbar on scroll down, show on scroll up
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const onScroll = () => {
      const st = container.scrollTop
      const diff = st - lastScrollTop.current
      
      // Ignore small movements - this creates an "accumulator" effect for slow scrolls
      if (Math.abs(diff) < 10) return
      
      if (diff > 0) {
        setShowNavbar(false)
        setSelectionPos(null)
        setActiveHighlight(null)
      } else {
        setShowNavbar(true)
      }
      // Only update lastScrollTop when threshold is crossed
      lastScrollTop.current = st <= 0 ? 0 : st
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, []) // eslint-disable-line

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (error || !link) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-neutral-500">Link not found</p>
      </div>
    )
  }

  const hostname = new URL(link.url).hostname.replace('www.', '')

  // ... (keeping effects)



  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
      


      <HighlightPopover
        highlight={activeHighlight}
        onClose={() => setActiveHighlight(null)}
        onDelete={handleDeleteHighlight}
      />

       <ReaderHighlightsList 
          isOpen={showHighlights}
          onClose={() => setShowHighlights(false)}
          htmlContent={link.content || ''}
          onJumpTo={handleJumpToHighlight}
       />

      {/* Top Navbar - hides on scroll */}
      <div
        className={`fixed top-0 left-0 right-0 z-20 transition-all duration-300 ease-in-out
                   ${showNavbar ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}
      >
        <div className="glass-nav h-14 flex items-center gap-2 px-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
              {hostname}
            </p>
          </div>

          <button
            onClick={() => setShowHighlights(!showHighlights)}
            className={`p-2 rounded-full transition-colors ${showHighlights ? 'bg-primary text-primary-foreground' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
          >
             <List className="w-5 h-5" />
          </button>

          <ReaderFormatOptions 
            currentSettings={settings}
            onSettingsChange={(newSettings) => setSettings(newSettings)}
          />
        </div>
      </div>

      {/* Main content area with scroll */}
      <div
        ref={scrollRef}
        onTouchStart={(e) => {
            touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        }}
        onTouchEnd={(e) => {
            if (!touchStart.current) return
            const dx = e.changedTouches[0].clientX - touchStart.current.x
            const dy = e.changedTouches[0].clientY - touchStart.current.y
            const dist = Math.sqrt(dx*dx + dy*dy)
            
            if (dist < 10) { // Tap detection
                if ((e.target as HTMLElement).tagName !== 'BUTTON' && 
                    !(e.target as HTMLElement).closest('button') &&
                    !(e.target as HTMLElement).closest('.reader-menu')) {
                     
                     if (window.getSelection()?.toString().length === 0) {
                        setShowNavbar(prev => !prev)
                     }
                }
            }
            touchStart.current = null
        }}
        className="h-screen overflow-y-auto"
      >
        {/* Container for absolute positioning of selection menu */}
        <div ref={containerRef} className="relative" onMouseUp={handleMouseUp}>
          {tempHighlightRects.map((rect, i) => (
            <div 
                key={i} 
                className="absolute z-10 bg-blue-200/50 dark:bg-blue-500/30 pointer-events-none rounded-sm"
                style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} 
            />
          ))}
          <ReaderSelectionMenu 
            position={selectionPos}
            onClose={() => {
                isMenuInteractingRef.current = false
                setSelectionPos(null)
                setTempHighlightRects([])
            }}
            onHighlight={handleHighlight}
            onInteractionChange={(active) => {
                isMenuInteractingRef.current = active
                if (active && selectedRangeRef.current && containerRef.current) {
                    const containerRect = containerRef.current.getBoundingClientRect()
                    const rects = Array.from(selectedRangeRef.current.getClientRects()).map(r => ({
                        top: r.top - containerRect.top,
                        left: r.left - containerRect.left,
                        width: r.width,
                        height: r.height
                    }))
                    setTempHighlightRects(rects)
                } else {
                    setTempHighlightRects([])
                }
            }}
          />
        <article 
            onClick={handleArticleClick}
            className={`${getWidthClass()} reader-content prose prose-neutral dark:prose-invert mx-auto px-4 py-8 pt-20 ${getFontClass()} transition-all duration-300`} 
            style={{ 
                '--reader-font-size': `${settings.fontSize / 100}rem`, 
                '--reader-line-height': settings.lineHeight 
            } as React.CSSProperties}
        >
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
            {link.title || 'Untitled'}
          </h1>

          {/* Status */}
          {link.status === 'pending' && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Content is being saved...</span>
            </div>
          )}

          {/* Content */}
          {link.content ? (
            <div
              ref={contentRef}
              className={`prose prose-neutral dark:prose-invert max-w-none
                         prose-headings:font-semibold
                         prose-a:text-blue-600 dark:prose-a:text-blue-400
                         prose-img:rounded-xl`}
              dangerouslySetInnerHTML={{ __html: link.content }}
            />
          ) : link.status === 'failed' ? (
            <div className="text-center py-8">
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                Failed to save content.
              </p>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
              >
                <ExternalLink className="w-4 h-4" />
                Open original
              </a>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-500 dark:text-neutral-400">
                Waiting for content...
              </p>
            </div>
          )}
        </article>
        </div>{/* Close containerRef */}
      </div>

      {/* Floating Action Pill - bottom center, hides on scroll */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-3 py-2 rounded-full
                   glass-card shadow-lg transition-all duration-300 ease-in-out
                   ${showNavbar ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}
      >
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-full
                     hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="text-sm font-medium">Open</span>
        </a>
        
        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600" />
        
        <button
          onClick={() => archiveMutation.mutate()}
          disabled={archiveMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full
                     hover:bg-black/5 dark:hover:bg-white/10 transition-colors
                     disabled:opacity-50"
        >
          <Archive className="w-4 h-4" />
          <span className="text-sm font-medium">
            {link.is_archived ? 'Indexed' : 'Archive'}
          </span>
        </button>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600" />

        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this link?')) {
                deleteMutation.mutate()
            }
          }}
          disabled={deleteMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full
                     hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 transition-colors
                     disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
