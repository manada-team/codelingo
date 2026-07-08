import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const EMPTY_TEST_CASE = { input: '', expectedOutput: '', hidden: false };

const EMPTY_FORM = {
    problemNumber: '',
    title: '',
    description: '',
    difficulty: 'EASY',
    xpReward: 20,
    testCases: [{ ...EMPTY_TEST_CASE }],
};

function AdminProblemsPanel() {
    const [form, setForm] = useState(EMPTY_FORM);
    const [problems, setProblems] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [problemsLoading, setProblemsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const token = localStorage.getItem('token');

    const nextProblemNumber = problems.length > 0
        ? Math.max(...problems.map(p => p.problemNumber)) + 1
        : 1;

    useEffect(() => {
        fetchProblems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchProblems() {
        setProblemsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/problems`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];
            setProblems(list);
            if (list.length > 0) {
                const max = Math.max(...list.map(p => p.problemNumber));
                setForm(f => ({ ...f, problemNumber: max + 1 }));
            }
        } catch {
            setError('Error al cargar problemas.');
        } finally {
            setProblemsLoading(false);
        }
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
        setError('');
        setSuccess('');
    }

    function handleTestCaseChange(index, field, value) {
        setForm(f => ({
            ...f,
            testCases: f.testCases.map((tc, i) => i === index ? { ...tc, [field]: value } : tc),
        }));
        setError('');
        setSuccess('');
    }

    function addTestCase() {
        setForm(f => ({ ...f, testCases: [...f.testCases, { ...EMPTY_TEST_CASE }] }));
    }

    function removeTestCase(index) {
        setForm(f => ({ ...f, testCases: f.testCases.filter((_, i) => i !== index) }));
    }

    async function handleEdit(problem) {
        setError('');
        setSuccess('');
        try {
            const res = await fetch(`${API_URL}/api/problems/${problem.id}/admin`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Error al cargar el problema');
            const data = await res.json();
            setEditingId(data.id);
            setForm({
                problemNumber: data.problemNumber,
                title: data.title,
                description: data.description || '',
                difficulty: data.difficulty,
                xpReward: data.xpReward,
                testCases: data.testCases.length > 0
                    ? data.testCases.map(tc => ({
                        input: tc.input || '',
                        expectedOutput: tc.expectedOutput,
                        hidden: tc.hidden,
                    }))
                    : [{ ...EMPTY_TEST_CASE }],
            });
        } catch (err) {
            setError(err.message);
        }
    }

    function handleCancelEdit() {
        setEditingId(null);
        setForm({ ...EMPTY_FORM, problemNumber: nextProblemNumber, testCases: [{ ...EMPTY_TEST_CASE }] });
        setError('');
        setSuccess('');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (form.testCases.length === 0) {
            setError('Necesitás al menos un caso de prueba.');
            return;
        }
        if (form.testCases.some(tc => !tc.expectedOutput.trim())) {
            setError('Todos los casos de prueba necesitan una salida esperada.');
            return;
        }

        setLoading(true);
        try {
            const body = JSON.stringify({
                problemNumber: Number(form.problemNumber),
                title: form.title,
                description: form.description,
                difficulty: form.difficulty,
                xpReward: Number(form.xpReward),
                testCases: form.testCases.map(tc => ({
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    hidden: !!tc.hidden,
                })),
            });
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            };

            if (editingId) {
                const res = await fetch(`${API_URL}/api/problems/${editingId}`, {
                    method: 'PUT',
                    headers,
                    body,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Error al editar problema');
                setSuccess(`Problema "${data.title}" actualizado exitosamente.`);
                setEditingId(null);
                setForm({ ...EMPTY_FORM, problemNumber: nextProblemNumber, testCases: [{ ...EMPTY_TEST_CASE }] });
                fetchProblems();
            } else {
                const res = await fetch(`${API_URL}/api/problems`, {
                    method: 'POST',
                    headers,
                    body,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Error al crear problema');
                setSuccess(`Problema "${data.title}" creado exitosamente.`);
                setForm({ ...EMPTY_FORM, problemNumber: data.problemNumber + 1, testCases: [{ ...EMPTY_TEST_CASE }] });
                fetchProblems();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('¿Eliminar este problema?')) return;
        try {
            const res = await fetch(`${API_URL}/api/problems/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Error al eliminar');
            setProblems(prev => prev.filter(p => p.id !== id));
            if (editingId === id) handleCancelEdit();
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="admin-screen">
            <div className="admin-left">
                <h2 className="admin-title">{editingId ? 'Editar problema' : 'Crear problema'}</h2>

                {error && <p className="admin-error">{error}</p>}
                {success && <p className="admin-success">{success}</p>}

                <form className="admin-form" onSubmit={handleSubmit}>
                    <div className="admin-row">
                        <div className="admin-field">
                            <label>Número de problema</label>
                            <input
                                type="number"
                                name="problemNumber"
                                value={form.problemNumber}
                                onChange={handleChange}
                                min="1"
                                required
                            />
                        </div>
                        <div className="admin-field">
                            <label>Dificultad</label>
                            <select name="difficulty" value={form.difficulty} onChange={handleChange}>
                                <option value="EASY">Fácil</option>
                                <option value="MEDIUM">Media</option>
                                <option value="HARD">Difícil</option>
                            </select>
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
                            placeholder="Ej: Suma de dos números"
                            required
                        />
                    </div>

                    <div className="admin-field">
                        <label>Enunciado</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Leé dos enteros por stdin e imprimí su suma..."
                            rows={4}
                            required
                        />
                    </div>

                    <div className="admin-field">
                        <label>
                            Casos de prueba
                            <span className="admin-optional"> (marcá "oculto" para que no se muestre al jugador)</span>
                        </label>
                        <div className="admin-test-cases">
                            {form.testCases.map((tc, i) => (
                                <div className="admin-test-case-row" key={i}>
                                    <div className="admin-test-case-fields">
                                        <textarea
                                            placeholder="Entrada (stdin, opcional)"
                                            value={tc.input}
                                            onChange={e => handleTestCaseChange(i, 'input', e.target.value)}
                                            rows={2}
                                        />
                                        <textarea
                                            placeholder="Salida esperada"
                                            value={tc.expectedOutput}
                                            onChange={e => handleTestCaseChange(i, 'expectedOutput', e.target.value)}
                                            rows={2}
                                            required
                                        />
                                    </div>
                                    <div className="admin-test-case-actions">
                                        <label className="admin-test-case-hidden">
                                            <input
                                                type="checkbox"
                                                checked={tc.hidden}
                                                onChange={e => handleTestCaseChange(i, 'hidden', e.target.checked)}
                                            />
                                            Oculto
                                        </label>
                                        <button
                                            type="button"
                                            className="admin-delete-btn"
                                            onClick={() => removeTestCase(i)}
                                            disabled={form.testCases.length <= 1}
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" className="admin-cancel-btn" onClick={addTestCase}>
                            + Agregar caso de prueba
                        </button>
                    </div>

                    <div className="admin-form-actions">
                        <button type="submit" className="admin-submit" disabled={loading}>
                            {loading
                                ? (editingId ? 'Guardando...' : 'Creando...')
                                : (editingId ? '✓ Guardar cambios' : '+ Crear problema')}
                        </button>
                        {editingId && (
                            <button type="button" className="admin-cancel-btn" onClick={handleCancelEdit}>
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="admin-right">
                <h2 className="admin-title">Problemas existentes</h2>
                {problemsLoading ? (
                    <p className="admin-loading">Cargando problemas...</p>
                ) : problems.length === 0 ? (
                    <p className="admin-loading">No hay problemas aún.</p>
                ) : (
                    <ul className="admin-levels-list">
                        {problems
                            .slice()
                            .sort((a, b) => a.problemNumber - b.problemNumber)
                            .map(problem => (
                                <li
                                    key={problem.id}
                                    className={`admin-level-item${editingId === problem.id ? ' admin-level-item--editing' : ''}`}
                                >
                                    <div className="admin-level-info">
                                        <span className="admin-level-num">#{problem.problemNumber}</span>
                                        <span className="admin-level-title">{problem.title}</span>
                                        <span className="admin-level-group">{problem.difficulty} · {problem.totalTestCases} casos</span>
                                    </div>
                                    <div className="admin-level-actions">
                                        <button className="admin-edit-btn" onClick={() => handleEdit(problem)}>
                                            Editar
                                        </button>
                                        <button className="admin-delete-btn" onClick={() => handleDelete(problem.id)}>
                                            Eliminar
                                        </button>
                                    </div>
                                </li>
                            ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default AdminProblemsPanel;
