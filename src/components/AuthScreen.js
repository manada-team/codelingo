import { useState, useEffect } from 'react';
import './AuthScreen.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

function EyeIcon({ open }) {
    return open ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
    );
}

function PasswordInput({ placeholder, value, onChange, required, minLength }) {
    const [show, setShow] = useState(false);
    return (
        <div className="auth-password-wrapper">
            <input
                type={show ? 'text' : 'password'}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                minLength={minLength}
            />
            <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShow(s => !s)}
                tabIndex={-1}
            >
                <EyeIcon open={show} />
            </button>
        </div>
    );
}

function AuthScreen({ onAuthSuccess }) {
    const [tab, setTab] = useState('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetForm, setResetForm] = useState({ token: '', newPassword: '', confirm: '' });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const resetToken = params.get('resetToken');
        const verifyToken = params.get('verifyToken');

        if (resetToken) {
            setResetForm(f => ({ ...f, token: resetToken }));
            setTab('reset');
            window.history.replaceState({}, '', window.location.pathname);
        } else if (verifyToken) {
            handleVerifyEmail(verifyToken);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    async function handleVerifyEmail(token) {
        try {
            const res = await fetch(`${API_URL}/api/auth/verify-email?token=${token}`);
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Error al verificar el email');
            setSuccessMsg('¡Email verificado! Ya podés iniciar sesión.');
            setTab('login');
        } catch (err) {
            setError(err.message);
            setTab('login');
        }
    }

    function switchTab(newTab) {
        setTab(newTab);
        setError('');
        setSuccessMsg('');
    }

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
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Error al registrarse');
            setTab('login');
            setSuccessMsg('Cuenta creada. Revisá tu email para verificar tu cuenta antes de iniciar sesión.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleForgotPassword(e) {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Error al enviar el email');
            setSuccessMsg(data.message || 'Revisá tu casilla de correo');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        setError('');
        if (resetForm.newPassword !== resetForm.confirm) {
            setError('Las contraseñas no coinciden');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: resetForm.token, newPassword: resetForm.newPassword }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Error al restablecer la contraseña');
            setSuccessMsg('¡Contraseña actualizada! Ya podés iniciar sesión.');
            setTimeout(() => switchTab('login'), 2000);
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

                {tab !== 'forgot' && tab !== 'reset' && (
                    <div className="auth-tabs">
                        <button
                            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
                            onClick={() => switchTab('login')}
                        >
                            Iniciar sesión
                        </button>
                        <button
                            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
                            onClick={() => switchTab('register')}
                        >
                            Registrarse
                        </button>
                    </div>
                )}

                {error && <p className="auth-error">{error}</p>}
                {successMsg && <p className="auth-success">{successMsg}</p>}

                {tab === 'login' && (
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
                        <PasswordInput
                            placeholder="Contraseña super segura"
                            value={loginForm.password}
                            onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Cargando...' : 'Entrar'}
                        </button>
                        <button type="button" className="auth-link-btn" onClick={() => switchTab('forgot')}>
                            ¿Olvidaste tu contraseña?
                        </button>
                    </form>
                )}

                {tab === 'register' && (
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
                        <PasswordInput
                            placeholder="Al menos 6 caracteres"
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

                {tab === 'forgot' && (
                    <form className="auth-form" onSubmit={handleForgotPassword}>
                        <h2 className="auth-form-title">Recuperar contraseña</h2>
                        <p className="auth-form-desc">
                            Ingresá tu email y te mandamos un link para resetear tu contraseña.
                        </p>
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="ejemplo@mail.com"
                            value={forgotEmail}
                            onChange={e => setForgotEmail(e.target.value)}
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Enviando...' : 'Enviar link'}
                        </button>
                        <button type="button" className="auth-link-btn" onClick={() => switchTab('login')}>
                            Volver al inicio de sesión
                        </button>
                    </form>
                )}

                {tab === 'reset' && (
                    <form className="auth-form" onSubmit={handleResetPassword}>
                        <h2 className="auth-form-title">Nueva contraseña</h2>
                        <label>Nueva contraseña</label>
                        <PasswordInput
                            placeholder="Al menos 6 caracteres"
                            value={resetForm.newPassword}
                            onChange={e => setResetForm({ ...resetForm, newPassword: e.target.value })}
                            required
                            minLength={6}
                        />
                        <label>Confirmar contraseña</label>
                        <PasswordInput
                            placeholder="Repetí la contraseña"
                            value={resetForm.confirm}
                            onChange={e => setResetForm({ ...resetForm, confirm: e.target.value })}
                            required
                            minLength={6}
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar contraseña'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default AuthScreen;