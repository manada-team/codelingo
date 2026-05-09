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

function GameScreen({ onBack }) {
    const codeRef = useRef(LANGUAGES.python.defaultCode);
    const [language, setLanguage] = useState('python');
    const [output, setOutput] = useState('');
    const [stderr, setStderr] = useState('');
    const [loading, setLoading] = useState(false);
    const [timeMs, setTimeMs] = useState(null);

    const [levels, setLevels] = useState([]);
    const [levelIndex, setLevelIndex] = useState(0);
    const [levelLoading, setLevelLoading] = useState(true);
    const [playerAnswer, setPlayerAnswer] = useState('');
    const [checkResult, setCheckResult] = useState(null);
    const [checkLoading, setCheckLoading] = useState(false);
    const level = levels[levelIndex] || null;
    const isLastLevel = levelIndex === levels.length - 1;
    useEffect(() => {
        async function fetchLevels() {
            setLevelLoading(true);
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/api/levels`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const data = await res.json();
                setLevels(data);
            } catch {
                // sin niveles
            } finally {
                setLevelLoading(false);
            }
        }
        fetchLevels();
    }, []);

    function handleLanguageChange(lang) {
        setLanguage(lang);
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
                body: JSON.stringify({ code: codeRef.current, language }),
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
        if (!level || !playerAnswer.trim()) return;
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
            const data = await res.json();
            setCheckResult(data);
        } catch {
            setCheckResult({ correct: false, message: 'Error al conectar con el servidor.' });
        } finally {
            setCheckLoading(false);
        }
    }

    function handleClear() {
        setOutput('');
        setStderr('');
        setTimeMs(null);
    }

    const hasOutput = output || stderr;

    return (
        <div className="game-screen">
            {/* ── Panel izquierdo: desafío ── */}
            <div className="challenge-panel">
                {levelLoading ? (
                    <p className="challenge-loading">Cargando nivel...</p>
                ) : level ? (
                    <>
                        <div className="challenge-header">
                            <span className="challenge-level">Nivel {level.levelNumber}</span>
                            {/*<span className="challenge-lang">{level.language}</span>*/}
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
                                onChange={e => {
                                    setPlayerAnswer(e.target.value);
                                    setCheckResult(null);
                                }}
                                onKeyDown={e => e.key === 'Enter' && handleCheckAnswer()}
                            />
                            <button
                                className="answer-btn"
                                onClick={handleCheckAnswer}
                                disabled={checkLoading || !playerAnswer.trim()}
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
                                <button
                                    className="next-btn"
                                    onClick={() => {
                                        setLevelIndex(i => i + 1);
                                        setPlayerAnswer('');
                                        setCheckResult(null);
                                    }}
                                >
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

            {/* ── Panel derecho: playground ── */}
            <div className="playground-panel">
                <div className="game-toolbar">
                    <div className="lang-tabs">
                        {Object.entries(LANGUAGES).map(([key, { label }]) => (
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