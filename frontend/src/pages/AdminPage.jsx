import { useMemo, useState } from 'react';
import { apiDelete, apiGet, apiPost } from '../api';

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const token = unlocked ? secret : null;

  const dashboardPromise = useMemo(() => (unlocked ? apiGet('/admin/dashboard', token) : Promise.resolve({})), [unlocked, token, refreshIndex]);
  const usersPromise = useMemo(
    () => (unlocked ? apiGet(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`, token) : Promise.resolve({ users: [] })),
    [unlocked, search, token, refreshIndex]
  );
  const scriptsPromise = useMemo(() => (unlocked ? apiGet('/admin/scripts?limit=50', token) : Promise.resolve({ scripts: [] })), [unlocked, token, refreshIndex]);

  const [dashboard, setDashboard] = useState({});
  const [users, setUsers] = useState([]);
  const [scripts, setScripts] = useState([]);

  if (unlocked && users.length === 0 && scripts.length === 0) {
    dashboardPromise.then((d) => setDashboard(d));
    usersPromise.then((u) => setUsers(u.users || []));
    scriptsPromise.then((s) => setScripts(s.scripts || []));
  }

  if (!unlocked) {
    return (
      <div className="card">
        <h2>Admin Access</h2>
        <input
          type="password"
          placeholder="Admin secret"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
        />
        <button
          onClick={async () => {
            const test = await apiGet('/admin/dashboard', secret);
            if (typeof test.total_users === 'number') {
              setUnlocked(true);
            }
          }}
        >
          Unlock Panel
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Admin Panel</h2>
      <p>Total users: {dashboard.total_users ?? '—'} | Total scripts: {dashboard.total_scripts ?? '—'}</p>

      <div className="card">
        <h3>Users</h3>
        <input value={search} placeholder="Search users" onChange={(e) => setSearch(e.target.value)} />
        <button onClick={() => setRefreshIndex((v) => v + 1)}>Refresh</button>
        {users.map((item) => (
          <div className="card-row" key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <p>{item.email} · {item.credits} credits · {item.plan}</p>
            </div>
            <div className="row-actions">
              <button
                onClick={async () => {
                  await apiPost('/admin/users/toggle', { user_id: item.id, is_active: !item.is_active }, token);
                  setRefreshIndex((v) => v + 1);
                  setUsers([]);
                  setScripts([]);
                }}
              >
                {item.is_active ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Scripts</h3>
        {scripts.map((item) => (
          <div className="card-row" key={item.id}>
            <div>
              <strong>{item.youtube_title || item.topic || 'Untitled'}</strong>
              <p>{item.category} · {item.user_id?.slice(0, 8)}</p>
            </div>
            <div className="row-actions">
              <button
                onClick={async () => {
                  await apiDelete(`/admin/scripts/${item.id}`, token);
                  setRefreshIndex((v) => v + 1);
                  setUsers([]);
                  setScripts([]);
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
