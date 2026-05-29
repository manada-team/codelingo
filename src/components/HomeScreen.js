import { useState, useEffect } from 'react';
import './HomeScreen.css';
import { FaCheckCircle, FaFire, FaStar, FaTrophy } from "react-icons/fa";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const LANGUAGE_LABELS = { python: 'Python', java: 'Java', c: 'C' };

function HomeScreen({ user, onStartGame, onLanguageChange }) {
    const [profile, setProfile] = useState(null);
    const [recentLevel, setRecentLevel] = useState(null);
    const [funFact, setFunFact] = useState('');
    const [loading, setLoading] = useState(true);
    const [langLoading, setLangLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        async function fetchData() {
            try {
                const [profileRes, progressRes, factRes] = await Promise.all([
                    fetch(`${API_URL}/api/users/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/api/users/me/progress`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/api/fun-facts/random`, { headers: { 'Authorization': `Bearer ${token}` } }),
                ]);
                const profileData = await profileRes.json();
                const progressData = await progressRes.json().catch(() => []);
                const factData = await factRes.json().catch(() => ({}));

                setProfile(profileData);
                setFunFact(factData.content || '');

                if (profileData.activeLanguage) {
                    onLanguageChange(profileData.activeLanguage);
                }

                const completed = Array.isArray(progressData) ? progressData.filter(p => p.completed) : [];
                if (completed.length > 0) {
                    const recent = [...completed].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];
                    setRecentLevel(recent);
                }
            } catch { /* mostramos lo que tengamos */ }
            finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    async function handleSelectLanguage(lang) {
        if (langLoading) return;
        setLangLoading(true);
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API_URL}/api/users/me/language`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ language: lang }),
            });
            onLanguageChange(lang);
            setProfile(prev => ({ ...prev, activeLanguage: lang }));
        } finally {
            setLangLoading(false);
        }
    }

    if (loading) return null;

    const activeLang = profile?.activeLanguage || user.activeLanguage;

    return (
        <div className="home-screen">
            <div className="home-left">
                <h2 className="home-welcome">Bienvenido, {user.username}!</h2>

                <div className="home-lang-section">
                    <span className="home-lang-label">Racha activa:</span>
                    {activeLang ? (
                        <div className="home-lang-locked">
                            <span className="home-lang-tab active">{LANGUAGE_LABELS[activeLang]}</span>
                        </div>
                    ) : (
                        <div className="home-lang-tabs">
                            {Object.entries(LANGUAGE_LABELS).map(([key, label]) => (
                                <button
                                    key={key}
                                    className="home-lang-tab"
                                    onClick={() => handleSelectLanguage(key)}
                                    disabled={langLoading}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                    {!activeLang && (
                        <span className="home-lang-hint">Elegí tu lenguaje para comenzar. Esta elección es permanente.</span>
                    )}
                </div>

                <button
                    className="home-start-btn"
                    onClick={onStartGame}
                    disabled={!activeLang}
                    title={!activeLang ? 'Seleccioná un lenguaje primero' : ''}
                >
                    Comenzar a jugar →
                </button>
            </div>

            <div className="home-right-col">
                {funFact && (
                    <div className="home-card fact-card">
                        <span className="home-card-fact-title">¿Sabías que...?</span>
                        <p className="home-card-fact">{funFact}</p>
                    </div>
                )}
                <div className="home-stats-grid-right">
                    <div className="home-stat">
                        <FaStar size={20} />
                        <span className="home-stat-value">{profile?.totalXp ?? 0}</span>
                        <span className="home-stat-label">XP acumulado</span>
                    </div>
                    <div className="home-stat streak-card">
                        <FaFire size={20} />
                        <span className="home-stat-value">{profile?.currentStreak ?? 0}</span>
                        <span className="home-stat-label">
                            {profile?.currentStreak === 1 ? 'día de racha' : 'días de racha'}
                        </span>
                    </div>
                    <div className="home-stat">
                        <FaCheckCircle size={20} />
                        <span className="home-stat-value">{profile?.completedLevels ?? 0}</span>
                        <span className="home-stat-label">Niveles completados</span>
                    </div>
                    {recentLevel && (
                        <div className="home-stat">
                            <FaTrophy size={20} />
                            <span className="home-stat-value">Nivel {recentLevel.levelNumber}</span>
                            <span className="home-stat-label">{recentLevel.levelTitle}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HomeScreen;