import { Target, LogOut, User, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import AuthModal from './AuthModal'

export default function Header() {
  const { user, isDemo } = useApp()
  const [showMenu, setShowMenu] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleSignOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    }
    setShowMenu(false)
  }

  return (
    <>
      <header className="bg-white/80 backdrop-blur-sm border-b border-cream-dark sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal/10 rounded-xl">
                <Target className="w-7 h-7 text-teal" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-brown font-[family-name:var(--font-display)]">
                  10 Weeks of AI Missions
                </h1>
                <p className="text-xs text-brown-light">
                  Master AI tools one challenge at a time
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!user && isSupabaseConfigured() && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal-dark transition-colors text-sm font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}

              {isDemo && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                  Demo Mode
                </span>
              )}

              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 hover:bg-cream rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-teal text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-cream-dark py-2">
                      <div className="px-4 py-2 border-b border-cream-dark">
                        <p className="text-sm font-medium text-brown truncate">
                          {user.email}
                        </p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 text-left text-sm text-brown hover:bg-cream flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  )
}
