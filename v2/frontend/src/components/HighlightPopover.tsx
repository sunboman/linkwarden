import { useEffect, useRef } from 'react'
import { Trash2, MessageSquare } from 'lucide-react'

interface HighlightPopoverProps {
    highlight: { id: string; comment?: string; rect: DOMRect } | null
    onClose: () => void
    onDelete: (id: string) => void
}

export function HighlightPopover({ highlight, onClose, onDelete }: HighlightPopoverProps) {
    const popoverRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    if (!highlight) return null

    return (
        <div
            ref={popoverRef}
            className="fixed z-50 animate-in fade-in zoom-in-95"
            style={{ 
                top: highlight.rect.top - 8, 
                left: highlight.rect.left + highlight.rect.width / 2,
                transform: 'translate(-50%, -100%)'
            }}
        >
            <div className="glass-card p-3 rounded-xl shadow-2xl max-w-xs">
                {highlight.comment && (
                    <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border-l-4 border-yellow-400">
                        <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                                {highlight.comment}
                            </p>
                        </div>
                    </div>
                )}
                
                <button
                    onClick={() => {
                        onDelete(highlight.id)
                        onClose()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Remove Highlight
                </button>
            </div>
            
            {/* Arrow pointing down */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white dark:border-t-neutral-800" />
        </div>
    )
}
