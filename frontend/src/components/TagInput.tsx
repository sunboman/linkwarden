import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, ChevronDown, Plus } from 'lucide-react'
import { api } from '@/lib/api'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
}

export function TagInput({ value, onChange }: TagInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch existing tags
  const { data: allTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.getTags(),
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter tags based on input
  const filteredTags = allTags.filter(
    tag => 
      tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(tag.name)
  )

  const addTag = (tagName: string) => {
    const trimmed = tagName.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInputValue('')
  }

  const removeTag = (tagName: string) => {
    onChange(value.filter(t => t !== tagName))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const showCreateOption = inputValue.trim() && 
    !allTags.some(t => t.name.toLowerCase() === inputValue.toLowerCase()) &&
    !value.includes(inputValue.trim())

  return (
    <div className="relative" ref={containerRef}>
      {/* Selected tags + input */}
      <div 
        className="flex flex-wrap gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 
                  border border-transparent focus-within:border-blue-500 min-h-[48px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selected tag pills */}
        {value.map(tag => (
          <span 
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg 
                      bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        
        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? "Add tags..." : ""}
          className="flex-1 min-w-[80px] bg-transparent outline-none text-sm placeholder:text-neutral-400"
        />
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (filteredTags.length > 0 || showCreateOption) && (
        <div className="absolute top-full left-0 right-0 mt-1 py-1 glass-card shadow-lg z-50 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
          {/* Create new tag option */}
          {showCreateOption && (
            <button
              type="button"
              onClick={() => addTag(inputValue)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm
                        hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-blue-600 dark:text-blue-400"
            >
              <Plus className="w-4 h-4" />
              Create "{inputValue.trim()}"
            </button>
          )}
          
          {/* Existing tags */}
          {filteredTags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => addTag(tag.name)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm
                        hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
