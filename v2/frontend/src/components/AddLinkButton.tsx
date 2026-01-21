import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AddLinkModal } from './AddLinkModal'

export function AddLinkButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="glass-fab"
        aria-label="Add link"
      >
        <Plus className="w-6 h-6" />
      </button>

      <AddLinkModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
