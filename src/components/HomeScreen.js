import { useState, useEffect } from 'react';
import './HomeScreen.css';
import { FaCheckCircle, FaFire, FaStar, FaTrophy } from "react-icons/fa";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const LANGUAGE_INFO = {
    python: { label: 'Python', icon: '🐍' },
    java:   { label: 'Java',   icon: '☕' },
    c:      { label: 'C',      icon: '⚙️' },
};

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
            } catch { }
            finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [onLanguageChange]);

    async function handleSelectLanguage(lang) {
        if (langLoading) return;
        setLangLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/users/me/language`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ language: lang }),
            });
            const data = await res.json();
            const newStarted = data.startedLanguages || [];
            onLanguageChange(lang);
            setProfile(prev => ({
                ...prev,
                activeLanguage: lang,
                startedLanguages: newStarted,
            }));
        } finally {
            setLangLoading(false);
        }
        onStartGame(lang);
    }

    if (loading) return null;

    const activeLang = profile?.activeLanguage || user.activeLanguage || '';
    const startedLangs = profile?.startedLanguages || [];

    const xpByLang = {
        python: profile?.xpPython ?? 0,
        java:   profile?.xpJava   ?? 0,
        c:      profile?.xpC      ?? 0,
    };

    return (
        <div className="home-screen">
            <div className="home-left">
                <h2 className="home-welcome">Bienvenido, {user.username}!</h2>

                <div className="home-lang-cards">
                    {Object.entries(LANGUAGE_INFO).map(([key, { label, icon }]) => {
                        const isStarted = startedLangs.includes(key);
                        const isSelected = activeLang === key;
                        return (
                            <button
                                key={key}
                                className={`home-lang-card${isSelected ? ' selected' : ''}${!isStarted ? ' not-started' : ''}`}
                                onClick={() => handleSelectLanguage(key)}
                                disabled={langLoading}
                            >
                                <span className="home-lang-card-icon">{icon}</span>
                                <span className="home-lang-card-name">{label}</span>
                                <span className="home-lang-card-xp">
                                    {isStarted ? `${xpByLang[key]} XP` : 'Iniciar racha'}
                                </span>
                                {isSelected && <span className="home-lang-card-playing">jugando</span>}
                            </button>
                        );
                    })}
                </div>
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