import { useState, useRef, useEffect } from 'react'
import { Type, Minus, Plus, ChevronRight, ChevronLeft, RotateCcw, Sun, Moon, Monitor } from 'lucide-react'

interface ReaderFormatOptionsProps {
  onSettingsChange: (settings: ReaderSettings) => void
  currentSettings: ReaderSettings
}

export interface ReaderSettings {
  font: string
  fontSize: number // percentage
  lineHeight: number
  lineWidth: 'narrow' | 'normal' | 'wide'
  theme: 'light' | 'dark' | 'system'
}

type MenuView = 'main' | 'font-style'

export function ReaderFormatOptions({ onSettingsChange, currentSettings }: ReaderFormatOptionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<MenuView>('main')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setView('main') // Reset view on close
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const updateSettings = (updates: Partial<ReaderSettings>) => {
    onSettingsChange({ ...currentSettings, ...updates })
  }

  const fonts = [
    { id: 'sans', label: 'San Francisco', family: 'font-sans' },
    { id: 'serif', label: 'New York', family: 'font-serif' },
    { id: 'mono', label: 'SF Mono', family: 'font-mono' },
    { id: 'inter', label: 'Inter', family: 'font-sans' }, // Fallback to sans for now
    { id: 'lora', label: 'Lora', family: 'font-serif' },
  ]

  const getLineWidthLabel = (w: string) => {
      switch(w) {
          case 'narrow': return 'Narrow'
          case 'normal': return 'Normal'
          case 'wide': return 'Wide'
          default: return 'Normal'
      }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full transition-colors ${
          isOpen ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'
        }`}
        aria-label="Formatting options"
      >
        <Type className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 glass-card overflow-hidden animate-in fade-in zoom-in-95 origin-top-right ring-1 ring-black/5 dark:ring-white/10">
          
          {/* Main View */}
          {view === 'main' && (
            <div className="p-1">
              {/* Font Style Row */}
              <button 
                onClick={() => setView('font-style')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                    <Type className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm font-medium">Font Style</span>
                </div>
                <div className="flex items-center gap-1 text-neutral-500">
                    <span className="text-sm">{fonts.find(f => f.id === currentSettings.font)?.label || 'Sans'}</span>
                    <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1 mx-2" />

              {/* Font Size Row */}
              <div className="flex items-center justify-between px-3 py-2">
                 <div className="flex items-center gap-3">
                    <span className="text-lg font-medium text-neutral-500 w-4 pl-0.5">T</span>
                    <span className="text-sm font-medium">Font Size</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-500 w-12 text-center">{currentSettings.fontSize}%</span>
                    <button 
                        onClick={() => updateSettings({ fontSize: Math.max(75, currentSettings.fontSize - 12.5) })}
                        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => updateSettings({ fontSize: Math.min(200, currentSettings.fontSize + 12.5) })}
                        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              {/* Line Height Row */}
              <div className="flex items-center justify-between px-3 py-2">
                 <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5 w-4 items-center">
                        <div className="w-full h-0.5 bg-neutral-400"></div>
                        <div className="w-full h-0.5 bg-neutral-400"></div>
                        <div className="w-full h-0.5 bg-neutral-400"></div>
                    </div>
                    <span className="text-sm font-medium">Line Height</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-500 w-12 text-center">{currentSettings.lineHeight.toFixed(1)}</span>
                    <button 
                        onClick={() => updateSettings({ lineHeight: Math.max(1.0, currentSettings.lineHeight - 0.1) })}
                        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => updateSettings({ lineHeight: Math.min(2.5, currentSettings.lineHeight + 0.1) })}
                        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                 </div>
              </div>



              {/* Theme Row */}
              <div className="flex items-center justify-between px-3 py-2">
                 <div className="flex items-center gap-3">
                    <Sun className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm font-medium">Theme</span>
                 </div>
                 <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
                    <button 
                        onClick={() => updateSettings({ theme: 'light' })}
                        className={`p-1.5 rounded-md transition-colors ${
                            currentSettings.theme === 'light' 
                                ? 'bg-white dark:bg-neutral-700 shadow-sm text-amber-500' 
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                        }`}
                        title="Light"
                    >
                        <Sun className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => updateSettings({ theme: 'system' })}
                        className={`p-1.5 rounded-md transition-colors ${
                            currentSettings.theme === 'system' 
                                ? 'bg-white dark:bg-neutral-700 shadow-sm text-blue-500' 
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                        }`}
                        title="System"
                    >
                        <Monitor className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => updateSettings({ theme: 'dark' })}
                        className={`p-1.5 rounded-md transition-colors ${
                            currentSettings.theme === 'dark' 
                                ? 'bg-white dark:bg-neutral-700 shadow-sm text-indigo-400' 
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                        }`}
                        title="Dark"
                    >
                        <Moon className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              {/* Line Width Row */}
              <div className="flex items-center justify-between px-3 py-2">
                 <div className="flex items-center gap-3">
                    <div className="flex gap-0.5 w-4 items-center justify-center">
                         <div className="w-0.5 h-3 bg-neutral-400"></div>
                         <div className="w-1 h-3 bg-transparent border-t border-b border-neutral-400"></div>
                         <div className="w-0.5 h-3 bg-neutral-400"></div>
                    </div>
                    <span className="text-sm font-medium">Line Width</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-500 w-12 text-center">{getLineWidthLabel(currentSettings.lineWidth)}</span>
                    <button 
                        onClick={() => {
                            const next = currentSettings.lineWidth === 'wide' ? 'normal' : currentSettings.lineWidth === 'normal' ? 'narrow' : 'narrow'
                            updateSettings({ lineWidth: next })
                        }}
                        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500"
                        disabled={currentSettings.lineWidth === 'narrow'}
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => {
                            const next = currentSettings.lineWidth === 'narrow' ? 'normal' : currentSettings.lineWidth === 'normal' ? 'wide' : 'wide'
                            updateSettings({ lineWidth: next })
                        }}
                        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500"
                        disabled={currentSettings.lineWidth === 'wide'}
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1 mx-2" />

              {/* Reset */}
              <button 
                onClick={() => updateSettings({ font: 'serif', fontSize: 112.5, lineHeight: 1.6, lineWidth: 'normal' })}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Defaults
              </button>
            </div>
          )}

          {/* Font Style View */}
          {view === 'font-style' && (
              <div className="flex flex-col h-full">
                  <div className="flex items-center px-1 py-1 border-b border-neutral-200 dark:border-neutral-800">
                      <button 
                        onClick={() => setView('main')}
                        className="p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500"
                      >
                          <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm font-medium ml-2">Font Style</span>
                  </div>
                  <div className="p-1 flex flex-col gap-1 max-h-64 overflow-y-auto">
                      {fonts.map(font => (
                          <button
                            key={font.id}
                            onClick={() => { updateSettings({ font: font.id }); setView('main'); }}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-colors
                                ${currentSettings.font === font.id 
                                    ? 'bg-neutral-100 dark:bg-neutral-800 text-primary font-medium' 
                                    : 'hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-400'}`}
                          >
                            <span className={font.family}>{font.label}</span>
                            {currentSettings.font === font.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                          </button>
                      ))}
                  </div>
              </div>
          )}
        </div>
      )}
    </div>
  )
}
