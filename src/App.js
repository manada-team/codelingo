import { useState, useCallback } from 'react';
import './App.css';
import AuthScreen from './components/AuthScreen';
import GameScreen from './components/GameScreen';
import AdminScreen from './components/AdminScreen';
import './components/GameScreen.css';
import ProfileScreen from './components/ProfileScreen';
import HomeScreen from './components/HomeScreen';
import ThemeSelector from './components/ThemeSelector';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme || 'default');
}

function App() {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        const role = localStorage.getItem('role');
        const activeLanguage = localStorage.getItem('activeLanguage') || null;
        const theme = localStorage.getItem('theme') || 'default';
        applyTheme(theme);

        return token ? { token, username, role, activeLanguage, theme } : null;
    });
    const [screen, setScreen] = useState('home');
    const [gameLanguage, setGameLanguage] = useState(null);


    function handleAuthSuccess(data) {
        localStorage.setItem('role', data.role);
        const theme = localStorage.getItem('theme') || 'default';
        setUser({ token: data.token, username: data.username, role: data.role, activeLanguage: null, theme });
    }

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        localStorage.removeItem('activeLanguage');
        localStorage.removeItem('theme');
        setUser(null);
        setScreen('home');
        applyTheme('default');
    }

    const handleLanguageChange = useCallback((lang) => {
        localStorage.setItem('activeLanguage', lang);
        setUser(prev => ({ ...prev, activeLanguage: lang }));
    }, []);

    const handleThemeChange = useCallback(async (theme) => {
        localStorage.setItem('theme', theme);
        setUser(prev => ({ ...prev, theme }));
        applyTheme(theme);
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API_URL}/api/users/me/theme`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ theme }),
            });
        } catch { }
    }, []);

    if (!user) {
        return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
    }

    const isAdmin = user.role === 'ADMIN';

    return (
        <div className="App">
            <header className="retro-header">
                <h1>Codelingo</h1>
                <nav>
                    <ul>
                        <li onClick={() => setScreen('home')}>Inicio</li>
                        <li onClick={() => { setGameLanguage(isAdmin ? null : user.activeLanguage); setScreen('game'); }}>Juego</li>
                        <li onClick={() => setScreen('profile')}>Perfil</li>
                        {isAdmin && (
                            <li onClick={() => setScreen('admin')}>Admin</li>
                        )}
                        <li>Contacto</li>
                        <li>
                            <ThemeSelector currentTheme={user.theme} onThemeChange={handleThemeChange} />
                        </li>
                        <li className="nav-user">
                            <span>Hola, {user.username}</span>
                            <button className="logout-btn" onClick={handleLogout}>Salir</button>
                        </li>
                    </ul>
                </nav>
            </header>
            <main className={`retro-main${screen === 'game' ? ' game-mode' : ''}`}>
                {screen === 'home' && (
                    <HomeScreen
                        user={user}
                        onStartGame={(lang) => { setGameLanguage(lang); setScreen('game'); }}
                        onLanguageChange={handleLanguageChange}
                        onThemeChange={handleThemeChange}
                    />
                )}
                {screen === 'game' && (
                    <GameScreen
                        onBack={() => setScreen('home')}
                        activeLanguage={gameLanguage}
                    />
                )}
                {screen === 'admin' && isAdmin && (
                    <AdminScreen />
                )}
                {screen === 'profile' && (
                    <ProfileScreen user={user} />
                )}
            </main>
            <footer className="retro-footer">
                <p>© 2026 Codelingo</p>
            </footer>
        </div>
    );
}

export default App;
