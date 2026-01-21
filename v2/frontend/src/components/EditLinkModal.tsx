import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { TagInput } from './TagInput'
import type { Link } from '@/types'

interface EditLinkModalProps {
  link: Link
  isOpen: boolean
  onClose: () => void
}

export function EditLinkModal({ link, isOpen, onClose }: EditLinkModalProps) {
  const [title, setTitle] = useState(link.title || '')
  const [description, setDescription] = useState(link.description || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(link.tags.map(t => t.name))
  const queryClient = useQueryClient()

  // Reset form when link changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(link.title || '')
      setDescription(link.description || '')
      setSelectedTags(link.tags.map(t => t.name))
    }
  }, [isOpen, link])

  const updateMutation = useMutation({
    mutationFn: () => {
      return api.updateLink(link.id, {
        title: title || undefined,
        description: description || undefined,
        tags: selectedTags,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      queryClient.invalidateQueries({ queryKey: ['link', String(link.id)] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      onClose()
    },
  })

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="glass-card w-full max-w-md mx-4 p-6 rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Edit Link</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateMutation.mutate()
          }}
          className="space-y-4"
        >
          {/* URL (readonly) */}
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-500">URL</label>
            <div className="px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm truncate">
              {link.url}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 
                        border border-transparent focus:border-blue-500 focus:outline-none
                        placeholder:text-neutral-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 
                        border border-transparent focus:border-blue-500 focus:outline-none
                        placeholder:text-neutral-400 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <TagInput value={selectedTags} onChange={setSelectedTags} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-neutral-200 dark:bg-neutral-700
                        hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-3 rounded-xl bg-blue-500 text-white
                        hover:bg-blue-600 transition-colors disabled:opacity-50
                        flex items-center justify-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
