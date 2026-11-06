import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import KanbanPage from './pages/KanbanPage';
import TaskDetailPage from './pages/TaskDetailPage';
import TeamPage from './pages/TeamPage';
import AiAssistantPage from './pages/AiAssistantPage';
import IntegrationsPage from './pages/IntegrationsPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId/board" element={<KanbanPage />} />
          <Route path="tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="ai" element={<AiAssistantPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
