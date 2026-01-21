import { Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { LinksPage } from './pages/LinksPage'
import { ReaderPage } from './pages/ReaderPage'
import { AddLinkButton } from './components/AddLinkButton'

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16 pb-20">
        <Routes>
          <Route path="/" element={<LinksPage />} />
          <Route path="/read/:id" element={<ReaderPage />} />
        </Routes>
      </main>
      <AddLinkButton />
    </div>
  )
}

export default App
