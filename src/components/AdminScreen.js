import { useState, useEffect } from 'react';
import './AdminScreen.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const EMPTY_FORM = {
    levelNumber: '',
    title: '',
    description: '',
    challengeContent: '',
    expectedOutput: '',
    xpReward: 10,
    levelGroupId: '',
};

function AdminScreen() {
    const [form, setForm] = useState(EMPTY_FORM);
    const [levelGroups, setLevelGroups] = useState([]);
    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [groupsLoading, setGroupsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const token = localStorage.getItem('token');

    useEffect(() => {
        async function fetchData() {
            setGroupsLoading(true);
            try {
                const [groupsRes, levelsRes] = await Promise.all([
                    fetch(`${API_URL}/api/level-groups`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    }),
                    fetch(`${API_URL}/api/levels`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    }),
                ]);
                const groupsData = await groupsRes.json();
                const levelsData = await levelsRes.json();
                setLevelGroups(Array.isArray(groupsData) ? groupsData : []);
                setLevels(Array.isArray(levelsData) ? levelsData : []);
            } catch {
                setError('Error al cargar datos.');
            } finally {
                setGroupsLoading(false);
            }
        }
        fetchData();
    }, [token]);

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
        setError('');
        setSuccess('');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/levels`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...form,
                    levelNumber: Number(form.levelNumber),
                    xpReward: Number(form.xpReward),
                    levelGroupId: Number(form.levelGroupId),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al crear nivel');
            setSuccess(`Nivel "${data.title}" creado exitosamente.`);
            setLevels(prev => [...prev, data]);
            setForm(EMPTY_FORM);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('¿Eliminar este nivel?')) return;
        try {
            const res = await fetch(`${API_URL}/api/levels/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Error al eliminar');
            setLevels(prev => prev.filter(l => l.id !== id));
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="admin-screen">
            <div className="admin-left">
                <h2 className="admin-title">Crear nivel</h2>

                {error && <p className="admin-error">{error}</p>}
                {success && <p className="admin-success">{success}</p>}

                {groupsLoading ? (
                    <p className="admin-loading">Cargando grupos...</p>
                ) : (
                    <form className="admin-form" onSubmit={handleSubmit}>
                        <div className="admin-row">
                            <div className="admin-field">
                                <label>Número de nivel</label>
                                <input
                                    type="number"
                                    name="levelNumber"
                                    value={form.levelNumber}
                                    onChange={handleChange}
                                    placeholder="1"
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="admin-field">
                                <label>XP de recompensa</label>
                                <input
                                    type="number"
                                    name="xpReward"
                                    value={form.xpReward}
                                    onChange={handleChange}
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div className="admin-field">
                            <label>Título</label>
                            <input
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="Ej: Variables en Python"
                                required
                            />
                        </div>

                        <div className="admin-field">
                            <label>Descripción <span className="admin-optional">(opcional)</span></label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Breve descripción del nivel..."
                                rows={2}
                            />
                        </div>

                        <div className="admin-field">
                            <label>Enunciado del desafío</label>
                            <textarea
                                name="challengeContent"
                                value={form.challengeContent}
                                onChange={handleChange}
                                placeholder="¿Cuál es el resultado de...?"
                                rows={5}
                                required
                            />
                        </div>

                        <div className="admin-field">
                            <label>Salida esperada</label>
                            <textarea
                                name="expectedOutput"
                                value={form.expectedOutput}
                                onChange={handleChange}
                                placeholder="Resultado exacto que debe ingresar el jugador"
                                rows={2}
                                required
                            />
                        </div>

                        <div className="admin-field">
                            <label>Grupo de niveles</label>
                            <select
                                name="levelGroupId"
                                value={form.levelGroupId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">-- Seleccioná un grupo --</option>
                                {levelGroups.map(g => (
                                    <option key={g.id} value={g.id}>
                                        {g.name} ({g.difficulty}) — Niveles {g.minLevel}–{g.maxLevel}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" className="admin-submit" disabled={loading}>
                            {loading ? 'Creando...' : '+ Crear nivel'}
                        </button>
                    </form>
                )}
            </div>

            <div className="admin-right">
                <h2 className="admin-title">Niveles existentes</h2>
                {levels.length === 0 ? (
                    <p className="admin-loading">No hay niveles aún.</p>
                ) : (
                    <ul className="admin-levels-list">
                        {levels
                            .slice()
                            .sort((a, b) => a.levelNumber - b.levelNumber)
                            .map(level => (
                                <li key={level.id} className="admin-level-item">
                                    <div className="admin-level-info">
                                        <span className="admin-level-num">#{level.levelNumber}</span>
                                        <span className="admin-level-title">{level.title}</span>
                                        <span className="admin-level-group">{level.levelGroupName}</span>
                                    </div>
                                    <button
                                        className="admin-delete-btn"
                                        onClick={() => handleDelete(level.id)}
                                    >
                                        Eliminar
                                    </button>
                                </li>
                            ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default AdminScreen;