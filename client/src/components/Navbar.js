/**
 * Vossle — Navbar v2
 * Minimal, professional top navigation with v2 design tokens.
 */

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show navbar in the video room
    if (location.pathname.startsWith('/room/')) return null;

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <nav style={s.nav}>
            <Link to="/" style={s.brand}>
                <img src="/vossle-logo.svg" alt="Vossle" style={s.logoImg} />
                <span style={s.brandName}>Vossle</span>
            </Link>

            <div style={s.actions}>
                {isAuthenticated ? (
                    <>
                        <Link to="/dashboard" style={{
                            ...s.navLink,
                            ...(location.pathname === '/dashboard' ? s.navLinkActive : {}),
                        }}>
                            Dashboard
                        </Link>
                        <div style={s.avatarPill}>
                            <div style={s.avatar}>
                                {user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                            </div>
                            <span style={s.userName}>{user?.name?.split(' ')[0]}</span>
                        </div>
                        <button onClick={handleLogout} style={s.logoutBtn}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={s.navLink}>Sign In</Link>
                        <Link to="/register" className="btn btn-primary btn-sm" style={s.ctaBtn}>
                            Get Started
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

const s = {
    nav: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 28px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10, 10, 15, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
    },
    brand: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        textDecoration: 'none',
    },
    logoImg: { width: 28, height: 28 },
    brandName: {
        fontSize: '1.15rem',
        fontWeight: 800,
        color: '#f0f0f5',
        letterSpacing: '-0.5px',
    },
    actions: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    navLink: {
        color: '#5e5e73',
        fontSize: '0.82rem',
        fontWeight: 500,
        textDecoration: 'none',
        padding: '6px 12px',
        borderRadius: '8px',
        transition: 'color 150ms',
    },
    navLinkActive: { color: '#f0f0f5' },
    avatarPill: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 12px 4px 4px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.06)',
    },
    avatar: {
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: '0.65rem',
    },
    userName: {
        color: '#c0c0d0',
        fontSize: '0.78rem',
        fontWeight: 500,
    },
    logoutBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        border: 'none',
        background: 'rgba(255,255,255,0.04)',
        color: '#5e5e73',
        cursor: 'pointer',
        transition: 'all 150ms',
    },
    ctaBtn: { fontSize: '0.8rem' },
};

export default Navbar;
