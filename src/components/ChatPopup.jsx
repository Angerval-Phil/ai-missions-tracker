import { useState } from 'react'
import { MessageSquare, X, Minimize2 } from 'lucide-react'
import ChatInterface from './ChatInterface'

export default function ChatPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-teal text-white rounded-full shadow-lg hover:bg-teal-dark transition-all hover:scale-105 z-50"
        title="Open AI Coach"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div
      className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-cream-dark z-50 transition-all duration-300 ${
        isMinimized ? 'w-72 h-14' : 'w-96 h-[550px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-cream-dark bg-cream/50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-teal" />
          <span className="font-medium text-brown text-sm">AI Coach</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-cream rounded-lg transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <Minimize2 className="w-4 h-4 text-brown-light" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-cream rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-brown-light" />
          </button>
        </div>
      </div>

      {/* Chat Content */}
      {!isMinimized && (
        <div className="h-[calc(100%-56px)]">
          <ChatInterface isPopup={true} />
        </div>
      )}
    </div>
  )
}
