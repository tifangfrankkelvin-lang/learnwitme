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
import Subjects from './pages/subjects.tsx'
import PastPapers from './pages/pastPapers.tsx'
import Revision from './pages/revision.tsx'
import Settings from './pages/settings.tsx'
import SearchPage from './pages/search.tsx'
import StudyPlan from './pages/studyPlan.tsx'

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
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/past-papers" element={<PastPapers />} />
        <Route path="/revision" element={<Revision />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/study-plan" element={<StudyPlan />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App