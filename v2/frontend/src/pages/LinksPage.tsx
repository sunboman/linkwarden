import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { LinkCard } from '@/components/LinkCard'
import { Loader2 } from 'lucide-react'

export function LinksPage() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const isArchived = params.get('archived') === 'true'
  const tag = params.get('tag') || undefined
  const search = params.get('search')?.toLowerCase() || ''

  const { data, isLoading, error } = useQuery({
    queryKey: ['links', isArchived, tag],
    queryFn: () => api.getLinks(0, isArchived, tag),
    // Auto-refetch every 2 seconds if there are pending links
    refetchInterval: (query) => {
      const links = query.state.data?.links || []
      const hasPending = links.some(link => link.status === 'pending')
      return hasPending ? 2000 : false
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <p className="text-neutral-500 dark:text-neutral-400 mb-4">
          Failed to load links. Please login first.
        </p>
        <LoginPrompt />
      </div>
    )
  }



  const filteredLinks = data?.links.filter(link => {
    if (!search) return true
    return (
      (link.title && link.title.toLowerCase().includes(search)) ||
      link.url?.toLowerCase().includes(search) ||
      link.description?.toLowerCase().includes(search)
    )
  })

  // Handle various empty states
  if (!filteredLinks?.length && data?.links.length) {
     return (
        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <p className="text-neutral-500 dark:text-neutral-400">
                No links match your search.
            </p>
        </div>
     )
  }

  if (!data?.links.length) {
    if (isArchived) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <p className="text-neutral-500 dark:text-neutral-400">
                    No archived links found.
                </p>
            </div>
        )
    }

    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <p className="text-neutral-500 dark:text-neutral-400">
          No links yet. Tap the + button to add your first link!
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      {/* Grid of links - Apple News style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredLinks?.map((link) => (
          <LinkCard key={`${link.id}-${link.image_url || ''}-${link.status}`} link={link} />
        ))}
      </div>
    </div>
  )
}

// Simple login component for demo
function LoginPrompt() {
  const handleLogin = async () => {
    try {
      await api.login('test', 'password123')
      window.location.reload()
    } catch {
      alert('Login failed. Make sure user exists.')
    }
  }

  return (
    <button
      onClick={handleLogin}
      className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors"
    >
      Login as test user
    </button>
  )
}
