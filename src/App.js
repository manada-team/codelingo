import { useState } from 'react';
import './App.css';
import AuthScreen from './components/AuthScreen';
import GameScreen from './components/GameScreen';
import AdminScreen from './components/AdminScreen';
import './components/GameScreen.css';
import ProfileScreen from './components/ProfileScreen';

function App() {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        const role = localStorage.getItem('role');
        return token ? { token, username, role } : null;
    });
    const [screen, setScreen] = useState('home');

    function handleAuthSuccess(data) {
        localStorage.setItem('role', data.role);
        setUser({ token: data.token, username: data.username, role: data.role });
    }

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        setUser(null);
        setScreen('home');
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
                    <section>
                        <h2>Bienvenido a CODELINGO</h2>
                        <p>Resuelve desafíos con programación.</p>
                        <button onClick={() => setScreen('game')}>Comenzar</button>
                    </section>
                )}
                {screen === 'game' && (
                    <GameScreen onBack={() => setScreen('home')} />
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