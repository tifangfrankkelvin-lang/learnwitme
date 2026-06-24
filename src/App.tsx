import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/landing.tsx'
import AuthCallback from './pages/authCallback.tsx'
import Dashboard from './pages/dashboard.tsx'
import Onboarding from './pages/onboarding.tsx'
import AITutor from './pages/aiTutor.tsx'
import Topics from './pages/topics.tsx'
import Admin from './pages/admin.tsx'
import ContentPage from './pages/content.tsx'
import Bookmarks from './pages/bookmarks.tsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ai-tutor" element={<AITutor />} />
        <Route path="/subjects/:subjectId" element={<Topics />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/topics/:topicId/content" element={<ContentPage />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App