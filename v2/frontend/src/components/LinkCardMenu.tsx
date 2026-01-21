import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, RefreshCw, Archive, Trash2, Edit3 } from 'lucide-react'
import { api } from '@/lib/api'
import type { Link } from '@/types'

interface LinkCardMenuProps {
  link: Link
  onEdit?: () => void
}

export function LinkCardMenu({ link, onEdit }: LinkCardMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const refreshMutation = useMutation({
    mutationFn: () => api.refreshLink(link.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      setIsOpen(false)
    },
  })

  const archiveMutation = useMutation({
    mutationFn: () => api.updateLink(link.id, { is_archived: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      setIsOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteLink(link.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      setIsOpen(false)
    },
  })

  const menuItems = [
    {
      label: 'Refresh',
      icon: RefreshCw,
      onClick: () => refreshMutation.mutate(),
      loading: refreshMutation.isPending,
    },
    {
      label: 'Archive',
      icon: Archive,
      onClick: () => archiveMutation.mutate(),
      loading: archiveMutation.isPending,
    },
    {
      label: 'Edit',
      icon: Edit3,
      onClick: () => {
        onEdit?.()
        setIsOpen(false)
      },
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: () => {
        if (confirm('Are you sure you want to delete this link?')) {
          deleteMutation.mutate()
        }
      },
      loading: deleteMutation.isPending,
      danger: true,
    },
  ]

  return (
    <div 
      className="relative" 
      ref={menuRef}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setIsOpen(!isOpen)
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="p-1.5 rounded-lg bg-black/20 dark:bg-black/40 backdrop-blur-sm
                   hover:bg-black/30 dark:hover:bg-black/50 transition-colors text-white"
        aria-label="Link options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-1 w-36 py-1 glass-card shadow-lg z-50 rounded-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  item.onClick()
                }}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={item.loading}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm
                          hover:bg-black/5 dark:hover:bg-white/10 transition-colors
                          disabled:opacity-50
                          ${item.danger ? 'text-red-500' : ''}`}
              >
                <Icon className={`w-4 h-4 ${item.loading ? 'animate-spin' : ''}`} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
