import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { LinksPage } from './pages/LinksPage'
import { ReaderPage } from './pages/ReaderPage'
import { LoginPage } from './pages/LoginPage'
import { SignUpPage } from './pages/SignUpPage'
import { AddLinkButton } from './components/AddLinkButton'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BottomBar } from './components/BottomBar'
import { useAuth } from './hooks/useAuth'
import { Loader2 } from 'lucide-react'

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

// Auth route wrapper (redirect to home if already logged in)
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppContent() {
  const location = useLocation()
  const isReaderPage = location.pathname.startsWith('/read/')

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-900">
      {/* Sidebar: Visible on desktop (md+), hidden on mobile */}
      {!isReaderPage && (
        <div className="hidden md:block sticky top-0 h-screen z-30">
          <Sidebar />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar: Visible on mobile only */}
        {!isReaderPage && (
          <div className="md:hidden sticky top-0 z-20">
            <Navbar />
          </div>
        )}

        {/* TopBar: Visible on desktop only (complements Sidebar) */}
        {!isReaderPage && (
          <div className="hidden md:block sticky top-0 z-20">
            <TopBar />
          </div>
        )}
        
        <main className={`flex-1 ${isReaderPage ? '' : 'pb-24 md:pb-0'}`}>
          <Routes>
            <Route path="/" element={<LinksPage />} />
            <Route path="/read/:id" element={<ReaderPage />} />
          </Routes>
        </main>

        {/* BottomBar: Visible on mobile only */}
        {!isReaderPage && (
          <BottomBar />
        )}
      </div>
      
      {/* FAB: Only show on links page (not reader, not archive) - AND Mobile Only */}
      {!isReaderPage && new URLSearchParams(location.search).get('archived') !== 'true' && (
        <div className="md:hidden">
            <AddLinkButton />
        </div>
      )}
      
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  )
}

function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={
        <AuthRoute>
          <LoginPage />
        </AuthRoute>
      } />
      <Route path="/signup" element={
        <AuthRoute>
          <SignUpPage />
        </AuthRoute>
      } />
      
      {/* Protected routes */}
      <Route path="/*" element={
        <ProtectedRoute>
          <AppContent />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App

