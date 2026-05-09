import { useState, useEffect } from 'react';
import './ProfileScreen.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

// ── Vista PLAYER ────────────────────────────────────────────────
function PlayerProfile({ token }) {
    const [profile, setProfile] = useState(null);
    const [progress, setProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                const [profileRes, progressRes] = await Promise.all([
                    fetch(`${API_URL}/api/users/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/api/users/me/progress`, { headers: { 'Authorization': `Bearer ${token}` } }),
                ]);
                setProfile(await profileRes.json());
                const p = await progressRes.json();
                setProgress(Array.isArray(p) ? p : []);
            } catch {
                setError('Error al cargar el perfil.');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [token]);

    if (loading) return <p className="profile-loading">Cargando perfil...</p>;
    if (error)   return <p className="profile-error">{error}</p>;
    if (!profile) return null;

    const completed = progress.filter(p => p.completed);
    const totalAttempts = progress.reduce((sum, p) => sum + p.attempts, 0);
    const memberSince = profile.createdAt
        ? new Date(profile.createdAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—';

    return (
        <div className="profile-screen">
            <div className="profile-header">
                <div className="profile-avatar">{profile.username.charAt(0).toUpperCase()}</div>
                <div className="profile-identity">
                    <h2 className="profile-username">{profile.username}</h2>
                    <p className="profile-email">{profile.email}</p>
                    <p className="profile-since">Miembro desde {memberSince}</p>
                </div>
            </div>

            <div className="profile-stats">
                <div className="stat-card">
                    <span className="stat-icon">⭐</span>
                    <span className="stat-value">{profile.totalXp}</span>
                    <span className="stat-label">XP total</span>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">🔥</span>
                    <span className="stat-value">{profile.currentStreak}</span>
                    <span className="stat-label">Racha actual</span>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">🏆</span>
                    <span className="stat-value">{profile.longestStreak}</span>
                    <span className="stat-label">Mejor racha</span>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">✅</span>
                    <span className="stat-value">{completed.length}</span>
                    <span className="stat-label">Niveles completados</span>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">🎯</span>
                    <span className="stat-value">{totalAttempts}</span>
                    <span className="stat-label">Intentos totales</span>
                </div>
            </div>

            <div className="profile-progress">
                <h3 className="profile-section-title">Historial de niveles</h3>
                {completed.length === 0 ? (
                    <p className="profile-empty">Todavía no completaste ningún nivel. ¡A jugar!</p>
                ) : (
                    <ul className="progress-list">
                        {completed
                            .slice()
                            .sort((a, b) => a.levelNumber - b.levelNumber)
                            .map(p => (
                                <li key={p.id} className="progress-item">
                                    <div className="progress-item-left">
                                        <span className="progress-level-num">Nivel {p.levelNumber}</span>
                                        <span className="progress-level-title">{p.levelTitle}</span>
                                        {p.levelGroupName && (
                                            <span className="progress-group">{p.levelGroupName}</span>
                                        )}
                                    </div>
                                    <div className="progress-item-right">
                                        <span className="progress-xp">+{p.xpReward} XP</span>
                                        <span className="progress-attempts">
                                            {p.attempts} {p.attempts === 1 ? 'intento' : 'intentos'}
                                        </span>
                                        {p.completedAt && (
                                            <span className="progress-date">
                                                {new Date(p.completedAt).toLocaleDateString('es-AR')}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

// ── Vista ADMIN ─────────────────────────────────────────────────
function AdminStats({ token }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState('totalXp');
    const [sortDir, setSortDir] = useState('desc');

    useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await fetch(`${API_URL}/api/users`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const data = await res.json();
                setUsers(Array.isArray(data) ? data : []);
            } catch {
                setError('Error al cargar los usuarios.');
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, [token]);

    if (loading) return <p className="profile-loading">Cargando jugadores...</p>;
    if (error)   return <p className="profile-error">{error}</p>;

    function toggleSort(key) {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    }

    const players = users.filter(u => u.role === 'PLAYER');

    const filtered = players
        .filter(u =>
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            const av = a[sortKey] ?? '';
            const bv = b[sortKey] ?? '';
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

    const totalXp = players.reduce((s, u) => s + u.totalXp, 0);
    const avgXp = players.length ? Math.round(totalXp / players.length) : 0;
    const activeToday = players.filter(u => {
        if (!u.lastActivityDate) return false;
        return u.lastActivityDate.startsWith(new Date().toISOString().slice(0, 10));
    }).length;

    function SortIcon({ col }) {
        if (sortKey !== col) return <span className="sort-icon inactive">↕</span>;
        return <span className="sort-icon">{sortDir === 'asc' ? '↑' : '↓'}</span>;
    }

    return (
        <div className="admin-stats-screen">
            <h2 className="admin-stats-title">Stats de jugadores</h2>

            {/* Resumen global */}
            <div className="admin-summary">
                <div className="summary-card">
                    <span className="summary-value">{players.length}</span>
                    <span className="summary-label">Jugadores</span>
                </div>
                <div className="summary-card">
                    <span className="summary-value">{totalXp.toLocaleString()}</span>
                    <span className="summary-label">XP acumulado total</span>
                </div>
                <div className="summary-card">
                    <span className="summary-value">{avgXp}</span>
                    <span className="summary-label">XP promedio</span>
                </div>
                <div className="summary-card">
                    <span className="summary-value">{activeToday}</span>
                    <span className="summary-label">Activos hoy</span>
                </div>
            </div>

            {/* Buscador */}
            <input
                className="admin-search"
                type="text"
                placeholder="Buscar por usuario o email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            {/* Tabla */}
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                    <tr>
                        <th onClick={() => toggleSort('username')}>
                            Usuario <SortIcon col="username" />
                        </th>
                        <th>Email</th>
                        <th onClick={() => toggleSort('totalXp')}>
                            XP <SortIcon col="totalXp" />
                        </th>
                        <th onClick={() => toggleSort('currentStreak')}>
                            Racha 🔥 <SortIcon col="currentStreak" />
                        </th>
                        <th onClick={() => toggleSort('longestStreak')}>
                            Mejor racha <SortIcon col="longestStreak" />
                        </th>
                        <th onClick={() => toggleSort('completedLevels')}>
                            Niveles ✅ <SortIcon col="completedLevels" />
                        </th>
                        <th onClick={() => toggleSort('createdAt')}>
                            Miembro desde <SortIcon col="createdAt" />
                        </th>
                        <th>Última actividad</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="admin-table-empty">
                                Sin resultados.
                            </td>
                        </tr>
                    ) : (
                        filtered.map(u => (
                            <tr key={u.id}>
                                <td>
                                    <div className="table-user">
                                            <span className="table-avatar">
                                                {u.username.charAt(0).toUpperCase()}
                                            </span>
                                        {u.username}
                                    </div>
                                </td>
                                <td className="table-email">{u.email}</td>
                                <td className="table-xp">{u.totalXp}</td>
                                <td>{u.currentStreak}</td>
                                <td>{u.longestStreak}</td>
                                <td>{u.completedLevels}</td>
                                <td className="table-date">
                                    {u.createdAt
                                        ? new Date(u.createdAt).toLocaleDateString('es-AR')
                                        : '—'}
                                </td>
                                <td className="table-date">
                                    {u.lastActivityDate || '—'}
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Entry point ─────────────────────────────────────────────────
function ProfileScreen({ user }) {
    const token = localStorage.getItem('token');
    const isAdmin = user?.role === 'ADMIN';

    return isAdmin
        ? <AdminStats token={token} />
        : <PlayerProfile token={token} />;
}

export default ProfileScreen;