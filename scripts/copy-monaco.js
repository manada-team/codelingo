// Copia los assets estaticos de monaco-editor a public/vs para que el
// editor se sirva desde el propio dominio en vez de depender del CDN de
// jsdelivr (que a veces no carga y rompe la pantalla de Problemas/Juego).
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'monaco-editor', 'min', 'vs');
const dest = path.join(__dirname, '..', 'public', 'vs');

if (!fs.existsSync(src)) {
    console.warn('[copy-monaco] No se encontró node_modules/monaco-editor/min/vs, se omite la copia.');
    process.exit(0);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log('[copy-monaco] Assets de monaco-editor copiados a public/vs');
