import { useState } from 'react';
import './App.css';
import AuthScreen from './components/AuthScreen';

function App() {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        return token ? { token, username } : null;
    });

    function handleAuthSuccess(data) {
        setUser({ token: data.token, username: data.username });
    }

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setUser(null);
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
                        <li>Inicio</li>
                        <li>Juego</li>
                        <li>Contacto</li>
                        <li className="nav-user">
                            <span>Hola, {user.username}</span>
                            <button className="logout-btn" onClick={handleLogout}>Salir</button>
                        </li>
                    </ul>
                </nav>
            </header>
            <main className="retro-main">
                <section>
                    <h2>Bienvenido a CODELINGO</h2>
                    <p>Resuelve desafíos con programación.</p>
                    <button>Comenzar</button>
                </section>
            </main>
            <footer className="retro-footer">
                <p>© 2026 Codelingo</p>
            </footer>
        </div>
    );
}

export default App;
