import { useParams, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ArrowLeft, ExternalLink, Archive, Loader2 } from 'lucide-react'
import { Navbar } from '@/components/Navbar'

export function ReaderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastScrollTop = useRef(0)
  const [showNavbar, setShowNavbar] = useState(true)

  const { data: link, isLoading, error } = useQuery({
    queryKey: ['link', id],
    queryFn: () => api.getLink(Number(id)),
    enabled: !!id,
  })

  const archiveMutation = useMutation({
    mutationFn: () => api.updateLink(Number(id), { is_archived: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      navigate('/')
    },
  })

  // Hide navbar on scroll down, show on scroll up
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const onScroll = () => {
      const st = container.scrollTop
      if (st - 10 > lastScrollTop.current) {
        setShowNavbar(false)
      } else if (st < lastScrollTop.current - 10) {
        setShowNavbar(true)
      }
      lastScrollTop.current = st <= 0 ? 0 : st
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [])

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

  return (
    <div className="min-h-screen">
      {/* Top Navbar - hides on scroll */}
      <div
        className={`fixed top-0 left-0 right-0 z-10 transition-transform duration-300 ease-in-out
                   ${showNavbar ? 'translate-y-0' : '-translate-y-full'}`}
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

          <Navbar />
        </div>
      </div>

      {/* Main content area with scroll */}
      <div
        ref={scrollRef}
        className={`overflow-y-auto transition-all duration-300 ease-in-out
                   ${showNavbar ? 'h-[calc(100vh-3.5rem)] mt-14' : 'h-screen mt-0'}`}
      >
        <article className="max-w-3xl mx-auto px-4 py-8">
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
              className="prose prose-neutral dark:prose-invert max-w-none
                         prose-headings:font-semibold
                         prose-a:text-blue-600 dark:prose-a:text-blue-400
                         prose-img:rounded-xl"
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
      </div>

      {/* Floating Action Pill - bottom center, hides on scroll */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-3 py-2 rounded-full
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
          disabled={archiveMutation.isPending || link.is_archived}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full
                     hover:bg-black/5 dark:hover:bg-white/10 transition-colors
                     disabled:opacity-50"
        >
          <Archive className="w-4 h-4" />
          <span className="text-sm font-medium">
            {link.is_archived ? 'Archived' : 'Archive'}
          </span>
        </button>
      </div>
    </div>
  )
}
