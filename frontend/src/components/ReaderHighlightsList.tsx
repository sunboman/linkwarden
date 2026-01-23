import { useEffect, useState } from 'react'
import { X, MessageSquare, ChevronRight } from 'lucide-react'

interface HighlightItem {
    id: string
    text: string
    color: string
    comment?: string
    timestamp?: number // Optional
}

interface ReaderHighlightsListProps {
    isOpen: boolean
    onClose: () => void
    htmlContent: string
    onJumpTo: (id: string) => void
}

export function ReaderHighlightsList({ isOpen, onClose, htmlContent, onJumpTo }: ReaderHighlightsListProps) {
    const [highlights, setHighlights] = useState<HighlightItem[]>([])

    useEffect(() => {
        if (!isOpen || !htmlContent) return

        // Parse highlights from HTML content
        // We look for spans with class "highlight" and id attribute
        const parser = new DOMParser()
        const doc = parser.parseFromString(htmlContent, 'text/html')
        const spans = doc.querySelectorAll('span.highlight')
        
        const extracted: HighlightItem[] = []
        spans.forEach((span) => {
            const id = span.id
            const colorClass = Array.from(span.classList).find(c => c.startsWith('bg-')) || 'bg-yellow-200'
            const comment = span.getAttribute('data-comment') || undefined
            
            // Map color class to simple name if needed, or use as is
            let color = 'yellow'
            if (colorClass.includes('yellow')) color = 'yellow'
            else if (colorClass.includes('green')) color = 'green'
            else if (colorClass.includes('red')) color = 'red'
            else if (colorClass.includes('blue')) color = 'blue'

            if (id) {
                extracted.push({
                    id,
                    text: span.textContent || '',
                    color,
                    comment
                })
            }
        })
        
        setHighlights(extracted)
    }, [isOpen, htmlContent])

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 z-40 bg-black/20 dark:bg-black/50 backdrop-blur-sm animate-in fade-in"
                onClick={onClose}
                aria-hidden="true"
            />
            
            {/* Sidebar */}
            <div className="fixed inset-y-0 right-0 z-50 w-full md:w-80 bg-surface-light dark:bg-surface-dark border-l border-neutral-200 dark:border-neutral-800 shadow-2xl transform transition-transform duration-300 ease-in-out p-4 pt-safe pb-safe overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">Highlights</h3>
                <button 
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 bg-neutral-100 dark:bg-neutral-800 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            {highlights.length === 0 ? (
                <div className="text-center mt-10 text-neutral-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No highlights yet</p>
                    <p className="text-xs mt-1">Select text to add highlight</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {highlights.map((hl) => (
                        <button
                            key={hl.id}
                            onClick={() => onJumpTo(hl.id)}
                            className="w-full text-left p-3 rounded-xl bg-card-light dark:bg-card-dark border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-1 h-full min-h-[1.5rem] rounded-full mt-1 shrink-0 bg-${hl.color}-400/80`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-neutral-800 dark:text-neutral-200 line-clamp-3 font-serif italic mb-1">
                                        "{hl.text}"
                                    </p>
                                    {hl.comment && (
                                        <div className="mt-2 flex items-start gap-1.5 p-2 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg">
                                            <MessageSquare className="w-3 h-3 mt-0.5 text-neutral-400 shrink-0" />
                                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                                {hl.comment}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity self-center" />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
        </>
    )
}
