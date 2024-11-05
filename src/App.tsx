import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import LoginPage from './components/auth/LoginPage';
import LeaderboardPage from './components/leaderboard/LeaderboardPage';
import { AuthProvider } from './components/auth/AuthProvider';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/" element={<Index />} />
          <Route path="/:startWord/:targetWord" element={<Index />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;