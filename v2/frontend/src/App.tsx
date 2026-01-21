import { Routes, Route, useLocation } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { LinksPage } from './pages/LinksPage'
import { ReaderPage } from './pages/ReaderPage'
import { AddLinkButton } from './components/AddLinkButton'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
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
        
        <main className={`flex-1 ${isReaderPage ? '' : 'pb-20 md:pb-0'}`}>
          <Routes>
            <Route path="/" element={<LinksPage />} />
            <Route path="/read/:id" element={<ReaderPage />} />
          </Routes>
        </main>
      </div>
      
      {/* FAB: Only show on links page */}
      {!isReaderPage && <AddLinkButton />}
      
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  )
}

export default App
