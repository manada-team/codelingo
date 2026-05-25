import { useState, useEffect } from 'react';
import './HomeScreen.css';
import {FaCheckCircle, FaFire, FaStar, FaTrophy} from "react-icons/fa";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

function HomeScreen({ user, onStartGame }) {
    const [profile, setProfile] = useState(null);
    const [recentLevel, setRecentLevel] = useState(null);
    const [funFact, setFunFact] = useState('');

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

                const completed = Array.isArray(progressData) ? progressData.filter(p => p.completed) : [];
                if (completed.length > 0) {
                    const recent = [...completed].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];
                    setRecentLevel(recent);
                }
            } catch { /* mostramos lo que tengamos */ }
        }
        fetchData();
    }, []);

    return (
        <div className="home-screen">

            <div className="home-left">
                <h2 className="home-welcome">Bienvenido, {user.username}!</h2>
                <button className="home-start-btn" onClick={onStartGame}>
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