import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './state/AuthContext';
import { apiGet } from './api';
import LoginPage from './pages/LoginPage';
import GeneratorPage from './pages/GeneratorPage';
import HistoryPage from './pages/HistoryPage';
import ViewScriptPage from './pages/ViewScriptPage';
import PlansPage from './pages/PlansPage';
import AdminPage from './pages/AdminPage';

function Shell({ children }) {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let mounted = true;
    apiGet('/generate/history', token).then((data) => {
      if (mounted && Array.isArray(data.scripts)) {
        setRecent(data.scripts.slice(0, 8));
      }
    });
    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">NUR</div>
        <div className="divider" />
        <div className="chip">✦ {user?.credits ?? 0} credits</div>
        <div className="muted">Plan: {(user?.plan || 'free').toUpperCase()}</div>
        <button onClick={() => navigate('/generator')}>✦ New Script</button>
        <button onClick={() => navigate('/history')}>📜 Script History</button>
        <button onClick={() => navigate('/plans')}>💎 Plans & Credits</button>
        <button onClick={() => navigate('/admin')}>🔐 Admin</button>
        <div className="divider" />
        <div className="muted">Recent</div>
        <div className="recent-list">
          {recent.length === 0 ? <p className="muted">No scripts yet</p> : null}
          {recent.map((item) => (
            <button key={item.id} onClick={() => navigate(`/script/${item.id}`)}>
              {(item.youtube_title || item.topic || 'Untitled').slice(0, 30)}
            </button>
          ))}
        </div>
        <div className="divider" />
        <div className="muted">{user?.name || 'User'}</div>
        <div className="muted">{user?.email || ''}</div>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Sign Out
        </button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

function Protected({ children }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <Shell>{children}</Shell>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/generator"
        element={
          <Protected>
            <GeneratorPage />
          </Protected>
        }
      />
      <Route
        path="/history"
        element={
          <Protected>
            <HistoryPage />
          </Protected>
        }
      />
      <Route
        path="/script/:scriptId"
        element={
          <Protected>
            <ViewScriptPage />
          </Protected>
        }
      />
      <Route
        path="/plans"
        element={
          <Protected>
            <PlansPage />
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected>
            <AdminPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/generator" replace />} />
    </Routes>
  );
}
