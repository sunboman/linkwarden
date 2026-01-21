import { Routes, Route, useLocation } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { LinksPage } from './pages/LinksPage'
import { ReaderPage } from './pages/ReaderPage'
import { AddLinkButton } from './components/AddLinkButton'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  const location = useLocation()
  const isReaderPage = location.pathname.startsWith('/read/')

  return (
    <div className="min-h-screen">
      {/* Only show main navbar on links page */}
      {!isReaderPage && <Navbar />}
      
      <main className={isReaderPage ? '' : 'pt-16 pb-20'}>
        <Routes>
          <Route path="/" element={<LinksPage />} />
          <Route path="/read/:id" element={<ReaderPage />} />
        </Routes>
      </main>
      
      {/* Only show add button on links page */}
      {!isReaderPage && <AddLinkButton />}
      
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  )
}

export default App
