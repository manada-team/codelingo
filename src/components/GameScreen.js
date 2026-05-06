import { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import './GameScreen.css';

const LANGUAGES = {
    python: {
        label: 'Python',
        monacoLang: 'python',
        defaultCode: `# Bienvenido al playground de Python!
print("Hola, Codelingo!")
 
# Probá con algo más:
for i in range(5):
    print(f"Número: {i}")
`,
    },
    c: {
        label: 'C',
        monacoLang: 'c',
        defaultCode: `#include <stdio.h>
 
int main() {
    printf("Hola, Codelingo!\\n");
 
    for (int i = 0; i < 5; i++) {
        printf("Número: %d\\n", i);
    }
 
    return 0;
}
`,
    },
    java: {
        label: 'Java',
        monacoLang: 'java',
        defaultCode: `// Bienvenido al playground de Java!
public class Main {
    public static void main(String[] args) {
        System.out.println("Hola, Codelingo!");
        for (int i = 0; i < 5; i++) {
            System.out.println("Número: " + i);
        }
    }
}
`,
    },
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

function GameScreen({ onBack }) {
    const editorRef = useRef(null);
    const codeRef = useRef(LANGUAGES.python.defaultCode);
    const [language, setLanguage] = useState('python');
    const [output, setOutput] = useState('');
    const [stderr, setStderr] = useState('');
    const [loading, setLoading] = useState(false);
    const [timeMs, setTimeMs] = useState(null);
    const [stdin, setStdin] = useState('');

    function handleLanguageChange(lang) {
        setLanguage(lang);
        codeRef.current = LANGUAGES[lang].defaultCode;
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
                body: JSON.stringify({
                    code: codeRef.current,
                    language,
                    stdin,
                }),
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

    function handleClear() {
        setOutput('');
        setStderr('');
        setTimeMs(null);
    }

    const hasOutput = output || stderr;

    return (
        <div className="game-screen">
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
                    {timeMs !== null && (
                        <span className="exec-time">{timeMs}ms</span>
                    )}
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
                    onChange={(val) => { codeRef.current = val || ''; }}
                    onMount={(editor) => {
                        editorRef.current = editor;
                        codeRef.current = LANGUAGES[language].defaultCode;
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
                    placeholder="Escribí los valores de entrada, uno por línea..."
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    spellCheck={false}
                />
            </div>

            <div className={`console-panel${hasOutput ? ' has-output' : ''}`}>
                <div className="console-header">
                    <span>Consola</span>
                    {hasOutput && (
                        <button className="clear-btn" onClick={handleClear}>
                            Limpiar
                        </button>
                    )}
                </div>
                <div className="console-body">
                    {!hasOutput && !loading && (
                        <span className="console-placeholder">
                            Presioná ▶ Ejecutar para ver el resultado...
                        </span>
                    )}
                    {loading && (
                        <span className="console-loading">Ejecutando código...</span>
                    )}
                    {output && <pre className="console-output">{output}</pre>}
                    {stderr && <pre className="console-stderr">{stderr}</pre>}
                </div>
            </div>
        </div>
    );
}

export default GameScreen;

