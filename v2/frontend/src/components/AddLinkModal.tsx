import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface AddLinkModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddLinkModal({ isOpen, onClose }: AddLinkModalProps) {
  const [url, setUrl] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (url: string) => api.createLink(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      setUrl('')
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      mutation.mutate(url.trim())
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* ... existing modal content ... */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 glass-card p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Link</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste URL here..."
            autoFocus
            required
            className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 
                       border border-neutral-200 dark:border-neutral-700
                       focus:outline-none focus:ring-2 focus:ring-primary
                       placeholder:text-neutral-400"
          />

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-medium
                       bg-neutral-200 dark:bg-neutral-700 
                       hover:bg-neutral-300 dark:hover:bg-neutral-600
                       transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !url.trim()}
              className="flex-1 px-4 py-3 rounded-xl font-medium
                       bg-primary text-primary-foreground
                       hover:opacity-90 disabled:opacity-50
                       transition-colors flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
