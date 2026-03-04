/**
 * Vossle — Login Page v2
 * Modern auth UI with SVG branding.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={s.page}>
            <div style={s.card}>
                {/* Header */}
                <div style={s.header}>
                    <img src="/vossle-logo.svg" alt="Vossle" style={s.logo} />
                    <h1 style={s.title}>Welcome back</h1>
                    <p style={s.subtitle}>Sign in to your Vossle account</p>
                </div>

                {error && (
                    <div style={s.error}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={s.form}>
                    <div style={s.inputGroup}>
                        <label style={s.label}>Email</label>
                        <div style={s.inputWrap}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5e5e73" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s.inputIcon}>
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                            </svg>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                autoFocus
                                style={s.input}
                            />
                        </div>
                    </div>

                    <div style={s.inputGroup}>
                        <label style={s.label}>Password</label>
                        <div style={s.inputWrap}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5e5e73" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s.inputIcon}>
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={8}
                                style={s.input}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" style={s.submitBtn} disabled={loading}>
                        {loading ? <span className="spinner" /> : 'Sign In'}
                    </button>
                </form>

                <div style={s.divider}>
                    <span style={s.dividerLine} />
                    <span style={s.dividerText}>or</span>
                    <span style={s.dividerLine} />
                </div>

                <p style={s.footer}>
                    Don't have an account?{' '}
                    <Link to="/register" style={s.link}>Create one</Link>
                </p>
            </div>
        </div>
    );
};

const s = {
    page: {
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '24px',
    },
    card: {
        width: '100%', maxWidth: '400px',
        background: 'rgba(18,18,26,0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px', padding: '36px 32px',
    },
    header: { textAlign: 'center', marginBottom: '28px' },
    logo: { width: 42, height: 42, marginBottom: '16px' },
    title: {
        fontSize: '1.4rem', fontWeight: 700,
        color: '#f0f0f5', marginBottom: '6px',
    },
    subtitle: { color: '#5e5e73', fontSize: '0.85rem' },
    error: {
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.15)',
        color: '#ef4444', padding: '10px 14px',
        borderRadius: '10px', fontSize: '0.82rem', marginBottom: '16px',
    },
    form: { display: 'flex', flexDirection: 'column', gap: '16px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: {
        fontSize: '0.78rem', fontWeight: 600,
        color: '#9191a8', textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    inputWrap: {
        position: 'relative', display: 'flex', alignItems: 'center',
    },
    inputIcon: {
        position: 'absolute', left: '14px', pointerEvents: 'none',
    },
    input: {
        width: '100%', padding: '12px 14px 12px 40px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px', color: '#f0f0f5',
        fontSize: '0.88rem', outline: 'none',
        fontFamily: "'Inter', sans-serif",
        transition: 'border-color 150ms',
    },
    submitBtn: { width: '100%', marginTop: '4px', padding: '14px' },
    divider: {
        display: 'flex', alignItems: 'center', gap: '12px',
        margin: '20px 0',
    },
    dividerLine: {
        flex: 1, height: '1px',
        background: 'rgba(255,255,255,0.06)',
    },
    dividerText: { fontSize: '0.72rem', color: '#5e5e73' },
    footer: {
        textAlign: 'center', color: '#5e5e73', fontSize: '0.82rem',
    },
    link: {
        color: '#818cf8', fontWeight: 600, textDecoration: 'none',
    },
};

export default Login;
