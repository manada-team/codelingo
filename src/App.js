import { useState } from 'react';
import './App.css';
import AuthScreen from './components/AuthScreen';
import GameScreen from './components/GameScreen';
import AdminScreen from './components/AdminScreen';
import './components/GameScreen.css';
import ProfileScreen from './components/ProfileScreen';
import HomeScreen from "./components/HomeScreen";
function App() {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        const role = localStorage.getItem('role');
        const activeLanguage = localStorage.getItem('activeLanguage') || null;
        return token ? { token, username, role, activeLanguage } : null;
    });
    const [screen, setScreen] = useState('home');

    function handleAuthSuccess(data) {
        localStorage.setItem('role', data.role);
        setUser({ token: data.token, username: data.username, role: data.role, activeLanguage: null });
    }

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        localStorage.removeItem('activeLanguage');
        setUser(null);
        setScreen('home');
    }

    function handleLanguageChange(lang) {
        localStorage.setItem('activeLanguage', lang);
        setUser(prev => ({ ...prev, activeLanguage: lang }));
    }

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
                        <li onClick={() => setScreen('game')}>Juego</li>
                        <li onClick={() => setScreen('profile')}>Perfil</li>
                        {isAdmin && (
                            <li onClick={() => setScreen('admin')}>Admin</li>
                        )}
                        <li>Contacto</li>
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
                        onStartGame={() => setScreen('game')}
                        onLanguageChange={handleLanguageChange}
                    />
                )}
                {screen === 'game' && (
                    <GameScreen
                        onBack={() => setScreen('home')}
                        activeLanguage={user.activeLanguage}
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