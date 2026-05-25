# Guía de instalación — codelingo (frontend)

React 19 · Create React App · Monaco Editor

---

## Herramientas necesarias

| Herramienta | Versión mínima | Cómo verificar  | Dónde bajar                    |
|-------------|----------------|-----------------|--------------------------------|
| Node.js     | 18             | `node -v`       | https://nodejs.org             |
| npm         | 9              | `npm -v`        | *(viene con Node.js)*          |
| Git         | cualquiera     | `git --version` | https://git-scm.com            |

> **Recomendación:** usar [nvm](https://github.com/nvm-sh/nvm) para manejar versiones de Node.
> ```bash
> nvm install 20
> nvm use 20
> ```

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/manada-team/codelingo.git
cd codelingo
```

---

## 2. Instalar dependencias

```bash
npm install
```

Esto instala todo lo definido en `package.json` (React, Monaco Editor, etc.).
La carpeta `node_modules` no se commitea, hay que correr esto cada vez que se clona el repo
o cuando cambie el `package.json`.

---

## 3. Archivos que hay que crear manualmente

### `.env.local`

Creá este archivo en la **raíz del proyecto** (al lado de `package.json`):

```env
REACT_APP_API_URL=http://localhost:8081
```

Este archivo le dice al frontend dónde está el backend.

> - El fallback hardcodeado en el código es `http://localhost:8081`, así que si el backend
    >   corre en ese puerto técnicamente funciona sin el `.env.local`, pero es mejor tenerlo explícito.
> - Si el backend corre en otro puerto, cambiá el valor acá.
> - Las variables de React **deben** empezar con `REACT_APP_` para que CRA las incluya en el bundle.
> - `.env.local` ya está en el `.gitignore`, nunca se va a subir al repo.

---

## 4. Levantar el proyecto en modo desarrollo

```bash
npm start
```

- Abre automáticamente `http://localhost:3000` en el browser.
- Tiene hot-reload: los cambios se reflejan sin reiniciar.
- Para detenerlo: `Ctrl + C`.

> **El backend tiene que estar corriendo** antes de intentar loguearse.
> Ver `backend-codelingo/install-guide.md`.

---

## 5. Scripts disponibles

| Comando          | Qué hace                                                     |
|------------------|--------------------------------------------------------------|
| `npm start`      | Levanta el servidor de desarrollo en `http://localhost:3000` |
| `npm test`       | Corre los tests en modo watch interactivo                    |
| `npm run build`  | Genera el build de producción optimizado en `/build`         |
| `npm run deploy` | Build + deploy a GitHub Pages                                |

│   │   ├── GameScreen.js     # Pantalla principal del juego (editor de código, desafíos)
│   │   ├── GameScreen.css
│   │   ├── AdminScreen.js    # Panel de administración (solo rol ADMIN)
│   │   ├── AdminScreen.css
│   │   ├── ProfileScreen.js  # Perfil del usuario y estadísticas
│   │   └── ProfileScreen.css
│   ├── index.js              # Entry point de React
│   └── index.css
├── .env.local                # (crearlo manualmente, ver paso 3)
├── package.json
└── install-guide.md
```

### Cómo funciona la autenticación

1. El usuario hace login/register → el backend devuelve un JWT + username + role.
2. Se guardan en `localStorage`.
3. Todos los requests autenticados envían `Authorization: Bearer <token>`.
4. El rol `ADMIN` habilita el panel de administración en la navbar.
5. Al hacer logout se limpia el `localStorage` y se vuelve a la pantalla de login.

---

## 7. Conectarse al backend

Todo el tráfico va a `REACT_APP_API_URL`. Para apuntar a distintos entornos cambiá el `.env.local`:

```env
# Backend local
REACT_APP_API_URL=http://localhost:8081

# Backend en otra máquina de la red
REACT_APP_API_URL=http://192.168.1.50:8081

# Backend en staging/producción
REACT_APP_API_URL=https://api.codelingo.example.com
```

Después de cambiar el `.env.local` hay que **reiniciar el servidor de desarrollo** (`Ctrl+C` + `npm start`)
porque CRA inyecta las variables al iniciar, no en caliente.

---

## 8. Flujo de trabajo con Git

### Convención de nombres de ramas

```
feat/descripcion-corta         # nueva funcionalidad
fix/descripcion-del-bug        # corrección de bug
refactor/que-se-refactoriza    # refactor sin cambio de comportamiento
docs/lo-que-se-documenta       # solo documentación
style/que-estilos-se-cambian   # cambios de CSS / estilos visuales
```

### Paso a paso para trabajar en una feature

```bash
# 1. Asegurarte de estar en main y actualizado
git checkout main
git pull origin main

# 2. Crear la rama nueva
git checkout -b feat/mi-nueva-pantalla

# 3. Hacer cambios, luego stagear y commitear
git add src/components/MiComponente.js src/components/MiComponente.css
git commit -m "feat: agregar pantalla de rankings"

# 4. Si mientras trabajás, main recibió cambios, incorporarlos
git fetch origin main
git rebase origin/main

# 5. Pushear y abrir PR
git push -u origin feat/mi-nueva-pantalla
```

Después en GitHub → **New Pull Request** → base: `main` ← compare: `feat/mi-nueva-pantalla`.

### Convención de mensajes de commit

```
feat:      nueva funcionalidad
fix:       corrección de bug
refactor:  cambio de código sin cambio de comportamiento
style:     cambios de CSS, formato visual
docs:      documentación
test:      agregar o modificar tests
chore:     cambios de dependencias, configuración
```

### Checklist antes de abrir un PR

- [ ] La app levanta sin errores en consola del browser
- [ ] Se probó el flujo completo relacionado al cambio (login → feature → logout)
- [ ] No hay `console.log` de debug olvidados
- [ ] No se commiteó el `.env.local` ni `node_modules`
- [ ] El PR tiene un título y descripción que explican qué cambia y por qué

---

## 9. Problemas frecuentes

**La app levanta pero no puede loguearse / network error**

1. Verificar que el backend esté corriendo.
2. Verificar que `REACT_APP_API_URL` en `.env.local` apunte al puerto correcto.
3. Abrir DevTools del browser → pestaña Network → ver qué URL está pegando el request y qué error devuelve.

**Error de CORS en el browser**
El backend tiene que tener habilitado CORS para `http://localhost:3000`.
Si ves `Access-Control-Allow-Origin` en el error, avisarle al equipo de backend.

**`Module not found` o errores raros al instalar**
```bash
# Borrar node_modules y reinstalar desde cero
rm -rf node_modules package-lock.json
npm install
```

**Los cambios en `.env.local` no se reflejan**
CRA carga las variables al iniciar. Reiniciá con `Ctrl+C` + `npm start`.

**`npm start` falla con `ENOSPC` en Linux**
```bash
# El sistema se quedó sin file watchers
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

**Puerto 3000 ya en uso**
CRA pregunta si querés usar otro puerto automáticamente. Aceptá con `Y`
o terminá el proceso que ocupa el 3000:
```bash
lsof -i :3000        # macOS / Linux
kill -9 <PID>
```