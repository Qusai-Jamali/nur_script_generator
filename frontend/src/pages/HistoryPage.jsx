import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiDelete, apiGet } from '../api';
import { useAuth } from '../state/AuthContext';

export default function HistoryPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [scripts, setScripts] = useState([]);

  const load = async () => {
    const result = await apiGet('/generate/history', token);
    setScripts(Array.isArray(result.scripts) ? result.scripts : []);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = scripts.filter((item) => {
    const key = search.toLowerCase();
    return (item.youtube_title || '').toLowerCase().includes(key) || (item.topic || '').toLowerCase().includes(key);
  });

  return (
    <div>
      <h2>Script History</h2>
      <input
        placeholder="Filter by title or topic"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="list">
        {filtered.map((item) => (
          <div key={item.id} className="card-row">
            <div>
              <strong>{item.youtube_title || item.topic || 'Untitled'}</strong>
              <p>{item.category} · {item.tone} · {item.duration} · {(item.created_at || '').slice(0, 10)}</p>
            </div>
            <div className="row-actions">
              <button onClick={() => navigate(`/script/${item.id}`)}>Open</button>
              <button
                onClick={async () => {
                  await apiDelete(`/generate/${item.id}`, token);
                  load();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
