import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './ProblemsScreen.css';

const LANGUAGES = {
    python: { label: 'Python', monacoLang: 'python' },
    c: { label: 'C', monacoLang: 'c' },
    java: { label: 'Java', monacoLang: 'java' },
};

const DIFFICULTY_LABELS = {
    EASY: 'Fácil',
    MEDIUM: 'Media',
    HARD: 'Difícil',
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

function ProblemsScreen({ onBack, activeLanguage }) {
    const lang = activeLanguage || 'python';
    const [language, setLanguage] = useState(lang);

    const [problems, setProblems] = useState([]);
    const [problemIndex, setProblemIndex] = useState(0);
    const [problemLoading, setProblemLoading] = useState(true);
    const [completedIds, setCompletedIds] = useState(new Set());
    const [showProblemNav, setShowProblemNav] = useState(false);

    const codeRef = useRef('');
    const [savedCode, setSavedCode] = useState({});
    const [runResult, setRunResult] = useState(null);
    const [submitResult, setSubmitResult] = useState(null);
    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const problem = problems[problemIndex] || null;
    const isLastProblem = problemIndex === problems.length - 1;
    const codeKey = problem ? `${problem.id}_${language}` : null;

    useEffect(() => {
        async function fetchJsonSafe(url, token) {
            try {
                const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) return null;
                return await res.json();
            } catch {
                return null;
            }
        }

        async function fetchData() {
            setProblemLoading(true);
            const token = localStorage.getItem('token');

            const [problemsData, progressData] = await Promise.all([
                fetchJsonSafe(`${API_URL}/api/problems`, token),
                fetchJsonSafe(`${API_URL}/api/users/me/problem-progress`, token),
            ]);

            const problemsList = Array.isArray(problemsData) ? problemsData : [];
            const completed = new Set(
                (Array.isArray(progressData) ? progressData : [])
                    .filter(p => p.completed)
                    .map(p => p.problemId)
            );
            setCompletedIds(completed);
            setProblems(problemsList);

            const firstUncompleted = problemsList.findIndex(p => !completed.has(p.id));
            setProblemIndex(firstUncompleted >= 0 ? firstUncompleted : 0);
            setProblemLoading(false);
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (!showProblemNav) return;
        function handleOutsideClick(e) {
            if (!e.target.closest('.problem-nav')) setShowProblemNav(false);
        }
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [showProblemNav]);

    function resetResults() {
        setRunResult(null);
        setSubmitResult(null);
    }

    function navigateToProblem(index) {
        setProblemIndex(index);
        resetResults();
        setShowProblemNav(false);
    }

    function handleLanguageChange(l) {
        setLanguage(l);
        resetResults();
    }

    async function handleRun() {
        if (!problem) return;
        setRunning(true);
        setRunResult(null);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/problems/${problem.id}/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ code: codeRef.current, language }),
            });
            const data = await res.json();
            setRunResult(data);
        } catch {
            setRunResult({ allPassed: false, passedCount: 0, totalCount: 0, results: [] });
        } finally {
            setRunning(false);
        }
    }

    async function handleSubmit() {
        if (!problem || submitResult?.allPassed) return;
        setSubmitting(true);
        setSubmitResult(null);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/problems/${problem.id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ code: codeRef.current, language }),
            });
            const data = await res.json();
            setSubmitResult(data);
            if (data.allPassed) {
                setCompletedIds(prev => new Set([...prev, problem.id]));
            }
        } catch {
            setSubmitResult({ allPassed: false, message: 'Error al conectar con el servidor.', results: [] });
        } finally {
            setSubmitting(false);
        }
    }

    function handleNextProblem() {
        const nextIndex = problemIndex + 1;
        setProblemIndex(nextIndex);
        resetResults();
    }

    const completedCount = completedIds.size;
    const totalCount = problems.length;

    return (
        <div className="problems-screen">
            <div className="problem-panel">
                {problemLoading ? (
                    <p className="problem-loading">Cargando problemas...</p>
                ) : problem ? (
                    <>
                        <div className="problem-nav">
                            <button
                                className="problem-nav-toggle"
                                onClick={() => setShowProblemNav(v => !v)}
                            >
                                <span>
                                    Problema {problem.problemNumber} de {totalCount}
                                    {totalCount > 0 && (
                                        <span className="problem-nav-progress">
                                            {' '}· {completedCount}/{totalCount} completados
                                        </span>
                                    )}
                                </span>
                                <span className="problem-nav-arrow">{showProblemNav ? '▲' : '▼'}</span>
                            </button>

                            {showProblemNav && (
                                <ul className="problem-nav-list">
                                    {problems.map((p, i) => {
                                        const isCompleted = completedIds.has(p.id);
                                        const isCurrent = i === problemIndex;
                                        return (
                                            <li
                                                key={p.id}
                                                className={`problem-nav-item${isCurrent ? ' current' : ''}${isCompleted ? ' done' : ''}`}
                                                onClick={() => navigateToProblem(i)}
                                            >
                                                <span className="problem-nav-status">
                                                    {isCompleted ? '✅' : isCurrent ? '▶' : '○'}
                                                </span>
                                                <span className="problem-nav-num">#{p.problemNumber}</span>
                                                <span className="problem-nav-name">{p.title}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        <div className="problem-header">
                            <span className="problem-number">#{problem.problemNumber}</span>
                            <span className={`problem-difficulty difficulty-${problem.difficulty?.toLowerCase()}`}>
                                {DIFFICULTY_LABELS[problem.difficulty] || problem.difficulty}
                            </span>
                        </div>
                        <h2 className="problem-title">{problem.title}</h2>
                        <div className="problem-description">
                            <pre>{problem.description}</pre>
                        </div>

                        {problem.sampleTestCases?.length > 0 && (
                            <div className="sample-cases">
                                <p className="sample-cases-label">Casos de ejemplo</p>
                                {problem.sampleTestCases.map((tc, i) => (
                                    <div className="sample-case" key={i}>
                                        {tc.input && (
                                            <div className="sample-case-row">
                                                <span className="sample-case-key">Entrada:</span>
                                                <pre>{tc.input}</pre>
                                            </div>
                                        )}
                                        <div className="sample-case-row">
                                            <span className="sample-case-key">Salida:</span>
                                            <pre>{tc.expectedOutput}</pre>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="submit-section">
                            <button
                                className="submit-btn"
                                onClick={handleSubmit}
                                disabled={submitting || !!submitResult?.allPassed}
                            >
                                {submitting ? 'Evaluando...' : '✓ Enviar solución'}
                            </button>

                            {submitResult && (
                                <div className={`submit-result ${submitResult.allPassed ? 'correct' : 'incorrect'}`}>
                                    {submitResult.message}
                                    {submitResult.allPassed && submitResult.xpEarned > 0 && (
                                        <span className="xp-badge">+{submitResult.xpEarned} XP</span>
                                    )}
                                </div>
                            )}

                            {submitResult?.allPassed && !isLastProblem && (
                                <button className="next-btn" onClick={handleNextProblem}>
                                    Siguiente problema →
                                </button>
                            )}
                            {submitResult?.allPassed && isLastProblem && (
                                <p className="all-done">¡Completaste todos los problemas!</p>
                            )}
                        </div>
                    </>
                ) : (
                    <p className="problem-loading">No hay problemas disponibles.</p>
                )}
            </div>

            <div className="editor-panel">
                <div className="problems-toolbar">
                    <div className="lang-tabs">
                        {Object.entries(LANGUAGES)
                            .filter(([key]) => !activeLanguage || key === activeLanguage)
                            .map(([key, { label }]) => (
                                <button
                                    key={key}
                                    className={`lang-tab${language === key ? ' active' : ''}`}
                                    onClick={() => handleLanguageChange(key)}
                                >
                                    {label}
                                </button>
                            ))}
                    </div>
                    <div className="problems-actions">
                        <button className="run-btn" onClick={handleRun} disabled={running || !problem}>
                            {running ? '⏳ Ejecutando...' : '▶ Probar con ejemplos'}
                        </button>
                        <button className="back-btn" onClick={onBack}>← Inicio</button>
                    </div>
                </div>

                <div className="editor-wrapper">
                    <Editor
                        key={codeKey}
                        height="100%"
                        language={LANGUAGES[language].monacoLang}
                        defaultValue={savedCode[codeKey] || ''}
                        onMount={(editor) => {
                            codeRef.current = editor.getValue();
                            editor.onDidChangeModelContent(() => {
                                const value = editor.getValue();
                                codeRef.current = value;
                                if (codeKey) {
                                    setSavedCode(prev => ({ ...prev, [codeKey]: value }));
                                }
                            });
                            setTimeout(() => editor.layout(), 50);
                        }}
                        theme="vs-dark"
                        options={{
                            fontSize: 14,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            fontFamily: "'Courier New', monospace",
                            lineNumbers: 'on',
                            automaticLayout: true,
                            padding: { top: 12 },
                        }}
                    />
                </div>

                <div className={`results-panel${runResult || submitResult ? ' has-output' : ''}`}>
                    <div className="results-header">
                        <span>Resultados</span>
                    </div>
                    <div className="results-body">
                        {!runResult && !submitResult && !running && (
                            <span className="results-placeholder">
                                Probá con los casos de ejemplo o enviá tu solución para validarla contra todos los casos.
                            </span>
                        )}
                        {running && <span className="results-loading">Ejecutando código...</span>}
                        {(runResult || submitResult) && (() => {
                            const result = submitResult || runResult;
                            return (
                                <>
                                    <p className="results-summary">
                                        {result.passedCount ?? 0} / {result.totalCount ?? 0} casos pasados
                                    </p>
                                    {(result.results || []).map((r, i) => (
                                        <div key={i} className={`test-case-result${r.passed ? ' passed' : ' failed'}`}>
                                            <div className="test-case-result-head">
                                                <span>{r.passed ? '✅' : '❌'} Caso {r.caseNumber}</span>
                                                {r.hidden && <span className="hidden-badge">oculto</span>}
                                            </div>
                                            {!r.hidden && !r.passed && (
                                                <div className="test-case-details">
                                                    {r.input && <p><strong>Entrada:</strong> <code>{r.input}</code></p>}
                                                    <p><strong>Esperado:</strong> <code>{r.expectedOutput}</code></p>
                                                    <p><strong>Obtenido:</strong> <code>{r.actualOutput}</code></p>
                                                    {r.stderr && <pre className="test-case-stderr">{r.stderr}</pre>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProblemsScreen;