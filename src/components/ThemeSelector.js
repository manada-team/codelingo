import { useState, useEffect, useRef } from 'react';
import './ThemeSelector.css';
import {FaPalette} from "react-icons/fa";

const THEMES = [
    {
        id: 'default',
        label: 'Default',
        colors: ['#FF69B4', '#FFC0CB'],
    },
    {
        id: 'hacker',
        label: 'Hacker',
        colors: ['#0d0d0d', '#00ff41'],
    },
    {
        id: 'retro-arcade',
        label: 'Retro',
        colors: ['#ff00ff', '#00ffff'],
    },
    {
        id: 'sunset',
        label: 'Atardecer',
        colors: ['#c0392b', '#8e44ad'],
    },
    {
        id: 'albirroja',
        label: 'Albirroja',
        colors: ['#D52B1E', '#ffffff'],
    },
];

function ThemeSelector({ currentTheme, onThemeChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        function handleClick(e) {
            if (!ref.current?.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    return (
        <div className="theme-selector" ref={ref}>
            <button
                className="theme-toggle-btn"
                onClick={() => setOpen(o => !o)}
                title="Cambiar tema"
            >
                {/*🎨*/}
                <FaPalette size={16} />

            </button>
            {open && (
                <div className="theme-dropdown">
                    <p className="theme-dropdown-title">Tema</p>
                    <div className="theme-swatches">
                        {THEMES.map(theme => (
                            <div key={theme.id} className="theme-swatch-item" onClick={() => { onThemeChange(theme.id); setOpen(false); }}>
                                <button
                                    className={`theme-swatch${currentTheme === theme.id ? ' active' : ''}`}
                                    title={theme.label}
                                    style={{
                                        background: `linear-gradient(135deg, ${theme.colors[0]} 50%, ${theme.colors[1]} 50%)`,
                                    }}
                                >
                                    {currentTheme === theme.id && <span className="theme-swatch-check">✓</span>}
                                </button>
                                <span className={`theme-label${currentTheme === theme.id ? ' active' : ''}`}>
                                    {theme.label}
                                </span>
                            </div>
                        ))}
                    </div>
                    {/*<div className="theme-labels">*/}
                    {/*    {THEMES.map(theme => (*/}
                    {/*        <span*/}
                    {/*            key={theme.id}*/}
                    {/*            className={`theme-label${currentTheme === theme.id ? ' active' : ''}`}*/}
                    {/*        >*/}
                    {/*            {theme.label}*/}
                    {/*        </span>*/}
                    {/*    ))}*/}
                    {/*</div>*/}
                </div>
            )}
        </div>
    );
}

export default ThemeSelector;
