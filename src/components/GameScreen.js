import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './GameScreen.css';

const LANGUAGES = {
    python: {
        label: 'Python',
        monacoLang: 'python',
        defaultCode: `# Bienvenido al playground de Python!\nprint("Hola, Codelingo!")`,
    },
    c: {
        label: 'C',
        monacoLang: 'c',
        defaultCode: `#include <stdio.h>\nint main() {\n    printf("Hola, Codelingo!\\n");\n    return 0;\n}`,
    },
    java: {
        label: 'Java',
        monacoLang: 'java',
        defaultCode: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hola, Codelingo!");\n    }\n}`,
    },
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

function GameScreen({ onBack, activeLanguage }) {
    const lang = activeLanguage || 'python';
    const codeRef = useRef(LANGUAGES[lang].defaultCode);
    const [language, setLanguage] = useState(lang);
    const [output, setOutput] = useState('');
    const [stderr, setStderr] = useState('');
    const [loading, setLoading] = useState(false);
    const [timeMs, setTimeMs] = useState(null);
    const [stdin, setStdin] = useState('');

    const [levels, setLevels] = useState([]);
    const [levelIndex, setLevelIndex] = useState(0);
    const [levelLoading, setLevelLoading] = useState(true);
    const [completedIds, setCompletedIds] = useState(new Set());
    const [savedAnswers, setSavedAnswers] = useState({});
    const [playerAnswer, setPlayerAnswer] = useState('');
    const [checkResult, setCheckResult] = useState(null);
    const [checkLoading, setCheckLoading] = useState(false);
    const [showLevelNav, setShowLevelNav] = useState(false);

    const level = levels[levelIndex] || null;
    const isLastLevel = levelIndex === levels.length - 1;

    useEffect(() => {
        async function fetchData() {
            setLevelLoading(true);
            const token = localStorage.getItem('token');
            try {
                const [levelsRes, progressRes] = await Promise.all([
                    fetch(`${API_URL}/api/levels`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    }),
                    fetch(`${API_URL}/api/users/me/progress`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    }),
                ]);
                const levelsData = await levelsRes.json();
                const progressData = await progressRes.json();

                const completed = new Set(
                    (Array.isArray(progressData) ? progressData : [])
                        .filter(p => p.completed)
                        .map(p => p.levelId)
                );
                setCompletedIds(completed);
                setLevels(levelsData);

                const firstUncompleted = levelsData.findIndex(l => !completed.has(l.id));
                setLevelIndex(firstUncompleted >= 0 ? firstUncompleted : 0);
            } catch {
                // sin niveles
            } finally {
                setLevelLoading(false);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (!showLevelNav) return;
        function handleOutsideClick(e) {
            if (!e.target.closest('.level-nav')) setShowLevelNav(false);
        }
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [showLevelNav]);

    function navigateToLevel(index) {
        const target = levels[index];
        setLevelIndex(index);
        setPlayerAnswer(savedAnswers[target.id] || '');
        setCheckResult(null);
        setShowLevelNav(false);
    }

    function handleAnswerChange(value) {
        setPlayerAnswer(value);
        if (level) {
            setSavedAnswers(prev => ({ ...prev, [level.id]: value }));
        }
    }

    function handleLanguageChange(l) {
        setLanguage(l);
        setOutput('');
        setStderr('');
        setTimeMs(null);
    }

    async function handleRun() {
        setLoading(true);
        setOutput('');
        setStderr('');
        setTimeMs(null);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ code: codeRef.current, language, stdin }),
            });
            const data = await res.json();
            if (data.error) {
                setStderr(data.error);
            } else {
                setOutput(data.output || '');
                setStderr(data.stderr || '');
                setTimeMs(data.timeMs);
            }
        } catch {
            setStderr('Error al conectar con el servidor.');
        } finally {
            setLoading(false);
        }
    }

    async function handleCheckAnswer() {
        if (!level || !playerAnswer.trim() || checkResult?.correct) return;
        setCheckLoading(true);
        setCheckResult(null);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/levels/${level.id}/check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ answer: playerAnswer }),
            });
            if (!res.ok) {
                setCheckResult({ correct: false, message: 'Error al verificar la respuesta. Intentá de nuevo.' });
                return;
            }
            const data = await res.json();
            setCheckResult(data);
            if (data.correct) {
                setCompletedIds(prev => new Set([...prev, level.id]));
            }
        } catch {
            setCheckResult({ correct: false, message: 'Error al conectar con el servidor.' });
        } finally {
            setCheckLoading(false);
        }
    }

    function handleNextLevel() {
        const nextIndex = levelIndex + 1;
        const nextLevel = levels[nextIndex];
        setLevelIndex(nextIndex);
        setPlayerAnswer(savedAnswers[nextLevel.id] || '');
        setCheckResult(null);
    }

    function handleClear() {
        setOutput('');
        setStderr('');
        setTimeMs(null);
    }

    const hasOutput = output || stderr;
    const completedCount = completedIds.size;
    const totalCount = levels.length;

    return (
        <div className="game-screen">
            <div className="challenge-panel">
                {levelLoading ? (
                    <p className="challenge-loading">Cargando niveles...</p>
                ) : level ? (
                    <>
                        <div className="level-nav">
                            <button
                                className="level-nav-toggle"
                                onClick={() => setShowLevelNav(v => !v)}
                            >
                                <span>
                                    Nivel {level.levelNumber} de {totalCount}
                                    {totalCount > 0 && (
                                        <span className="level-nav-progress">
                                            {' '}· {completedCount}/{totalCount} completados
                                        </span>
                                    )}
                                </span>
                                <span className="level-nav-arrow">{showLevelNav ? '▲' : '▼'}</span>
                            </button>

                            {showLevelNav && (
                                <ul className="level-nav-list">
                                    {levels.map((l, i) => {
                                        const isCompleted = completedIds.has(l.id);
                                        const isCurrent = i === levelIndex;
                                        return (
                                            <li
                                                key={l.id}
                                                className={`level-nav-item${isCurrent ? ' current' : ''}${isCompleted ? ' done' : ''}`}
                                                onClick={() => navigateToLevel(i)}
                                            >
                                                <span className="level-nav-status">
                                                    {isCompleted ? '✅' : isCurrent ? '▶' : '○'}
                                                </span>
                                                <span className="level-nav-num">#{l.levelNumber}</span>
                                                <span className="level-nav-name">{l.title}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        <div className="challenge-header">
                            <span className="challenge-level">Nivel {level.levelNumber}</span>
                        </div>
                        <h2 className="challenge-title">{level.title}</h2>
                        {level.description && (
                            <p className="challenge-description">{level.description}</p>
                        )}
                        <div className="challenge-content">
                            <pre>{level.challengeContent}</pre>
                        </div>
                        <div className="answer-section">
                            <label className="answer-label">Tu respuesta:</label>
                            <input
                                className="answer-input"
                                type="text"
                                placeholder="Escribí el resultado..."
                                value={playerAnswer}
                                readOnly={!!checkResult?.correct}
                                onChange={e => handleAnswerChange(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCheckAnswer()}
                            />
                            <button
                                className="answer-btn"
                                onClick={handleCheckAnswer}
                                disabled={checkLoading || !playerAnswer.trim() || !!checkResult?.correct}
                            >
                                {checkLoading ? 'Verificando...' : 'Enviar'}
                            </button>
                            {checkResult && (
                                <div className={`check-result ${checkResult.correct ? 'correct' : 'incorrect'}`}>
                                    {checkResult.message}
                                    {checkResult.correct && checkResult.xpEarned > 0 && (
                                        <span className="xp-badge">+{checkResult.xpEarned} XP</span>
                                    )}
                                </div>
                            )}
                            {checkResult?.correct && !isLastLevel && (
                                <button className="next-btn" onClick={handleNextLevel}>
                                    Siguiente nivel →
                                </button>
                            )}
                            {checkResult?.correct && isLastLevel && (
                                <p className="all-done">¡Completaste todos los niveles!</p>
                            )}
                        </div>
                    </>
                ) : (
                    <p className="challenge-loading">No hay niveles disponibles.</p>
                )}
            </div>

            <div className="playground-panel">
                <div className="game-toolbar">
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
                    <div className="game-actions">
                        {timeMs !== null && <span className="exec-time">{timeMs}ms</span>}
                        <button className="run-btn" onClick={handleRun} disabled={loading}>
                            {loading ? '⏳ Ejecutando...' : '▶ Ejecutar'}
                        </button>
                        <button className="back-btn" onClick={onBack}>← Inicio</button>
                    </div>
                </div>

                <div className="editor-wrapper">
                    <Editor
                        key={language}
                        height="100%"
                        language={LANGUAGES[language].monacoLang}
                        defaultValue={LANGUAGES[language].defaultCode}
                        onMount={(editor) => {
                            codeRef.current = editor.getValue();
                            editor.onDidChangeModelContent(() => {
                                codeRef.current = editor.getValue();
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

                <div className="stdin-panel">
                    <div className="stdin-header">Entrada (stdin)</div>
                    <textarea
                        className="stdin-body"
                        placeholder="Escribí el input de tu programa aquí (cada línea = un Enter)..."
                        value={stdin}
                        onChange={e => setStdin(e.target.value)}
                        spellCheck={false}
                    />
                </div>

                <div className={`console-panel${hasOutput ? ' has-output' : ''}`}>
                    <div className="console-header">
                        <span>Consola</span>
                        {hasOutput && (
                            <button className="clear-btn" onClick={handleClear}>Limpiar</button>
                        )}
                    </div>
                    <div className="console-body">
                        {!hasOutput && !loading && (
                            <span className="console-placeholder">Presioná ▶ Ejecutar para ver el resultado...</span>
                        )}
                        {loading && <span className="console-loading">Ejecutando código...</span>}
                        {output && <pre className="console-output">{output}</pre>}
                        {stderr && <pre className="console-stderr">{stderr}</pre>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GameScreen;