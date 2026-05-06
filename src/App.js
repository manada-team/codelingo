import { useState } from 'react';
import './App.css';
import AuthScreen from './components/AuthScreen';
import GameScreen from './components/GameScreen';
import './components/GameScreen.css';

function App() {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        return token ? { token, username } : null;
    });
    const [screen, setScreen] = useState('home');


    function handleAuthSuccess(data) {
        setUser({ token: data.token, username: data.username });
    }

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setUser(null);
        setScreen('home');

    }

    if (!user) {
        return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
    }

    return (
        <div className="App">
            <header className="retro-header">
                <h1>Codelingo</h1>
                <nav>
                    <ul>
                        <li onClick={() => setScreen('home')}>Inicio</li>
                        <li onClick={() => setScreen('game')}>Juego</li>
                        <li>Contacto</li>
                        <li className="nav-user">
                            <span>Hola, {user.username}</span>
                            <button className="logout-btn" onClick={handleLogout}>Salir</button>
                        </li>
                    </ul>
                </nav>
            </header>
            <main className="retro-main">
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
            </main>
            <footer className="retro-footer">
                <p>© 2026 Codelingo</p>
            </footer>
        </div>
    );
}

export default App;
