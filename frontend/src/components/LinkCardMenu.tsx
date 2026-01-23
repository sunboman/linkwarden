import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const menuRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const inMenu = menuRef.current?.contains(target)
      const inDropdown = dropdownRef.current?.contains(target)

      if (!inMenu && !inDropdown) {
        setIsOpen(false)
        setShowDeleteConfirm(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle scroll to close menu (simplest way to avoid detached floating menu)
  useEffect(() => {
      if (!isOpen) return
      const handleScroll = () => setIsOpen(false)
      window.addEventListener('scroll', handleScroll, { capture: true })
      return () => window.removeEventListener('scroll', handleScroll, { capture: true })
  }, [isOpen])


  const refreshMutation = useMutation({
    mutationFn: () => api.refreshLink(link.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      setIsOpen(false)
    },
    onError: (error) => {
      alert(`Failed to refresh link: ${error.message}`)
    },
  })

  const archiveMutation = useMutation({
    mutationFn: () => api.updateLink(link.id, { is_archived: !link.is_archived }),
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
    onError: (error) => {
      alert(`Failed to delete link: ${error.message}`)
    },
  })

  // Reset confirm state when menu opens/closes
  useEffect(() => {
    if (!isOpen) setShowDeleteConfirm(false)
  }, [isOpen])

  const toggleOpen = () => {
      if (!isOpen && menuRef.current) {
          const rect = menuRef.current.getBoundingClientRect()
          setCoords({
              top: rect.bottom + 4,
              left: rect.right
          })
          setIsOpen(true)
      } else {
          setIsOpen(false)
      }
  }

  const menuItems = link.is_archived
    ? [
        {
          label: 'Unarchive',
          icon: Archive,
          onClick: () => archiveMutation.mutate(),
          loading: archiveMutation.isPending,
        },
      ]
    : [
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
          toggleOpen()
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className={`p-1.5 rounded-lg bg-black/20 dark:bg-black/40 
                   hover:bg-black/30 dark:hover:bg-black/50 transition-colors text-white backdrop-blur-sm
                   ${isOpen ? 'bg-black/40 dark:bg-black/60' : ''}`}
        aria-label="Link options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed w-40 py-1 glass-card shadow-lg z-[9999] rounded-xl overflow-hidden"
          style={{ 
              top: coords.top, 
              left: coords.left,
              transform: 'translateX(-100%)' // Align right edge to button right edge
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Regular Items */}
          {!showDeleteConfirm && (
            <>
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
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm
                              hover:bg-black/5 dark:hover:bg-white/10 transition-colors
                              disabled:opacity-50"
                  >
                    <Icon className={`w-4 h-4 ${item.loading ? 'animate-spin' : ''}`} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
              
              {/* Delete Button Triggers Confirmation */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setShowDeleteConfirm(true)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm
                          hover:bg-red-500/10 text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </>
          )}

          {/* Confirmation State */}
          {showDeleteConfirm && (
            <div className="px-2 py-1">
              <p className="text-xs text-neutral-500 px-1 mb-2 text-center">Delete this link?</p>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    setShowDeleteConfirm(false)
                  }}
                  className="flex-1 px-2 py-1 text-xs rounded-md bg-neutral-100 dark:bg-neutral-800 
                           text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    deleteMutation.mutate()
                  }}
                  className="flex-1 px-2 py-1 text-xs rounded-md bg-red-500 text-white hover:bg-red-600"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
