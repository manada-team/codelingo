import { useState } from 'react';
import './AuthScreen.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

function AuthScreen({ onAuthSuccess }) {
    const [tab, setTab] = useState('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });

    async function handleLogin(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión');
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('role', data.role);
            onAuthSuccess(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al registrarse');
            setTab('login');
            setLoginForm({ username: registerForm.username, password: '' });
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <h1 className="auth-logo">Codelingo</h1>
                <p className="auth-subtitle">Resuelve desafíos con programación</p>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
                        onClick={() => { setTab('login'); setError(''); }}
                    >
                        Iniciar sesión
                    </button>
                    <button
                        className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
                        onClick={() => { setTab('register'); setError(''); }}
                    >
                        Registrarse
                    </button>
                </div>

                {error && <p className="auth-error">{error}</p>}

                {tab === 'login' ? (
                    <form className="auth-form" onSubmit={handleLogin}>
                        <label>Usuario</label>
                        <input
                            type="text"
                            placeholder="Nombre de usuario"
                            value={loginForm.username}
                            onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                            required
                        />
                        <label>Contraseña</label>
                        <input
                            type="password"
                            placeholder="Contraseña super segura"
                            value={loginForm.password}
                            onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Cargando...' : 'Entrar'}
                        </button>
                    </form>
                ) : (
                    <form className="auth-form" onSubmit={handleRegister}>
                        <label>Usuario</label>
                        <input
                            type="text"
                            placeholder="Nombre de usuario"
                            value={registerForm.username}
                            onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })}
                            required
                        />
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="ejemplo@mail.com"
                            value={registerForm.email}
                            onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                            required
                        />
                        <label>Contraseña</label>
                        <input
                            type="password"
                            placeholder="Contraseña super segura con al menos 6 caracteres"
                            value={registerForm.password}
                            onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                            required
                            minLength={6}
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Cargando...' : 'Crear cuenta'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default AuthScreen;

