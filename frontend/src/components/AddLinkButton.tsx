import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AddLinkModal } from './AddLinkModal'

export function AddLinkButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center 
                   bg-sky-200 text-sky-900 shadow-lg hover:bg-sky-300 dark:bg-sky-300 dark:text-sky-950 
                   transition-all duration-200 active:scale-95"
        aria-label="Add link"
      >
        <Plus className="w-6 h-6" />
      </button>

      <AddLinkModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
