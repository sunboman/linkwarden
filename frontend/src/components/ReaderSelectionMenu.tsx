import { useEffect, useRef, useState } from 'react'
import { X, MessageSquare, Check } from 'lucide-react'

interface ReaderSelectionMenuProps {
  position: { top: number; left: number } | null
  onHighlight: (color: string, comment?: string, isAnnotation?: boolean) => void
  onClose: () => void
  onInteractionChange?: (isInteracting: boolean) => void
}

import { useMediaQuery } from '@/hooks/useMediaQuery'

export function ReaderSelectionMenu({ position, onHighlight, onClose, onInteractionChange }: ReaderSelectionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'colors' | 'note'>('colors')
  const [commentText, setCommentText] = useState('')
  const isMobile = useMediaQuery('(max-width: 768px)')

  // ... (keep useEffects same as before, lines 16-51)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const selection = window.getSelection()
        if (selection && !selection.isCollapsed) {
          return
        }
        requestAnimationFrame(() => {
          const sel = window.getSelection()
          if (!sel || sel.isCollapsed) {
            onClose()
          }
        })
      }
    }
    document.addEventListener('mouseup', handleClickOutside)
    return () => document.removeEventListener('mouseup', handleClickOutside)
  }, [onClose])

  useEffect(() => {
     onInteractionChange?.(mode === 'note')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    if (position) {
      setMode('colors')
      setCommentText('')
    }
  }, [position])

  if (!position) return null

  const colors = [
    { id: 'yellow', bg: 'bg-yellow-200', border: 'border-yellow-400' },
    { id: 'green', bg: 'bg-green-200', border: 'border-green-400' },
    { id: 'red', bg: 'bg-red-200', border: 'border-red-400' },
    { id: 'blue', bg: 'bg-blue-200', border: 'border-blue-400' },
  ]

  const handleSaveNote = () => {
    setMode('colors')
    onHighlight('annotation', commentText, true)
    onClose()
  }

  const handleCancel = () => {
    setMode('colors')
    setCommentText('')
  }

  const ColorsView = () => (
    <div className="flex items-center gap-2 p-2">
      <div className="flex items-center gap-1 border-r border-neutral-200 dark:border-neutral-700 pr-2 mr-1">
        {colors.map((color) => (
          <button
            key={color.id}
            onClick={() => {
                onHighlight(color.id, '', false)
                onClose()
            }}
            className={`w-8 h-8 md:w-6 md:h-6 rounded-full ${color.bg} border ${color.border} hover:scale-110 transition-transform`}
            aria-label={`Highlight ${color.id}`}
          />
        ))}
      </div>
      
      <button 
        onClick={() => setMode('note')}
        className="p-2 md:p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
        title="Add Note"
      >
        <MessageSquare className="w-5 h-5 md:w-4 md:h-4" />
      </button>

      <button 
        onClick={onClose}
        className="ml-1 p-2 md:p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600"
      >
        <X className="w-5 h-5 md:w-4 md:h-4" />
      </button>
    </div>
  )

  const NoteView = () => (
    <div className="p-3 w-full md:w-72">
      <textarea 
        autoFocus
        className="w-full h-24 md:h-20 bg-neutral-100 dark:bg-neutral-900 rounded-lg p-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mb-3 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
        placeholder="Add a note..."
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSaveNote()
            }
            if (e.key === 'Escape') {
                handleCancel()
            }
        }}
      />
      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          className="flex-1 py-3 md:py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveNote}
          className="flex-1 flex items-center justify-center gap-2 py-3 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          <Check className="w-4 h-4" />
          Save
        </button>
      </div>
    </div>
  )

  if (isMobile) {
      // Mobile: Fixed Bottom Sheet
      return (
        <div 
            ref={menuRef}
            className="fixed bottom-0 left-0 right-0 z-[100] pb-safe px-4 pt-2 bg-neutral-50/95 dark:bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom-10 duration-200"
            onMouseDown={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
             <div className="mx-auto max-w-lg">
                {mode === 'colors' ? <ColorsView /> : <NoteView />}
             </div>
        </div>
      )
  }

  // Desktop: Absolute Popover
  return (
    <div
      ref={menuRef}
      className="absolute z-50"
      style={{ 
        top: position.top, 
        left: position.left, 
        transform: 'translateX(-50%) translateY(-100%) translateY(-8px)'
      }}
      onMouseDown={(e) => {
          e.stopPropagation()
          if (e.target instanceof HTMLElement && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
            e.preventDefault()
          }
      }}
    >
      <div className="glass-card shadow-xl animate-in fade-in zoom-in-95 rounded-xl overflow-hidden">
        {mode === 'colors' ? <ColorsView /> : <NoteView />}
      </div>
      
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white dark:border-t-neutral-800 drop-shadow-sm" />
    </div>
  )
}
