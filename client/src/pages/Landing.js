/**
 * Vossle — Landing Page v2
 * Premium marketing page with SVG icons and modern sections.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Feature data with SVG paths ── */
const features = [
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
        ),
        color: '#818cf8',
        bg: 'rgba(99,102,241,0.1)',
        title: 'End-to-End Encrypted',
        desc: 'DTLS-SRTP encryption on every call. Your conversations are always private and secure.',
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
        ),
        color: '#22d3ee',
        bg: 'rgba(6,182,212,0.1)',
        title: 'HD Video & Audio',
        desc: 'Crystal-clear 1080p video with adaptive bitrate that adjusts to your network in real time.',
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
        ),
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.1)',
        title: 'Ultra Low Latency',
        desc: 'Geo-distributed TURN relays with ICE trickling for sub-100ms connection setup.',
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        color: '#22c55e',
        bg: 'rgba(34,197,94,0.1)',
        title: 'Enterprise Auth',
        desc: 'JWT-based authentication with secure token rotation. Role-based access built in.',
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        ),
        color: '#f472b6',
        bg: 'rgba(244,114,182,0.1)',
        title: 'In-Call Chat',
        desc: 'Real-time encrypted messaging with message grouping, reactions, and file sharing.',
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
            </svg>
        ),
        color: '#a78bfa',
        bg: 'rgba(167,139,250,0.1)',
        title: 'Screen Sharing',
        desc: 'Share your entire screen or a specific window with high-fidelity system audio capture.',
    },
];

const stats = [
    { value: '<100ms', label: 'Connection Time' },
    { value: '1080p', label: 'Video Quality' },
    { value: '256-bit', label: 'Encryption' },
    { value: '99.9%', label: 'Uptime' },
];

const Landing = () => {
    const { isAuthenticated } = useAuth();

    return (
        <div style={s.page}>
            {/* Hero */}
            <section style={s.hero}>
                <div style={s.heroInner}>
                    <div style={s.badge}>
                        <span style={s.badgeDot} />
                        Enterprise-Grade WebRTC Platform
                    </div>

                    <h1 style={s.title}>
                        Video calls that feel<br />
                        <span style={s.titleGradient}>like being there.</span>
                    </h1>

                    <p style={s.subtitle}>
                        Vossle delivers crystal-clear 1-to-1 video communication with
                        end-to-end encryption, enterprise authentication, and zero-compromise
                        quality — engineered for professionals.
                    </p>

                    <div style={s.ctas}>
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="btn btn-primary btn-lg" style={s.ctaPrimary}>
                                Open Dashboard
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="btn btn-primary btn-lg" style={s.ctaPrimary}>
                                    Get Started Free
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                                </Link>
                                <Link to="/login" className="btn btn-secondary btn-lg">
                                    Sign In
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Hero visual */}
                <div style={s.heroVisual}>
                    <div style={s.mockWindow}>
                        <div style={s.mockDots}>
                            <span style={{ ...s.dot, background: '#ef4444' }} />
                            <span style={{ ...s.dot, background: '#f59e0b' }} />
                            <span style={{ ...s.dot, background: '#22c55e' }} />
                        </div>
                        <div style={s.mockContent}>
                            <div style={s.mockVideoGrid}>
                                <div style={s.mockVideoTile}>
                                    <div style={s.mockAvatar}>
                                        <span>UF</span>
                                    </div>
                                    <div style={s.mockNameTag}>Umi Tech</div>
                                </div>
                                <div style={s.mockVideoTile}>
                                    <div style={{ ...s.mockAvatar, background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>
                                        <span>SP</span>
                                    </div>
                                    <div style={s.mockNameTag}>Search Partner</div>
                                </div>
                            </div>
                            <div style={s.mockControls}>
                                {['🎤', '📹', '🖥️', '💬', '📞'].map(
                                    (e, i) => <span key={i} style={{
                                        ...s.mockControlBtn,
                                        ...(i === 4 ? { background: '#ef4444' } : {}),
                                    }}>{e}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section style={s.statsSection}>
                {stats.map((stat, i) => (
                    <div key={i} style={s.statItem}>
                        <span style={s.statValue}>{stat.value}</span>
                        <span style={s.statLabel}>{stat.label}</span>
                    </div>
                ))}
            </section>

            {/* Features */}
            <section style={s.featuresSection}>
                <div style={s.featuresSectionHeader}>
                    <h2 style={s.sectionTitle}>Built for professionals</h2>
                    <p style={s.sectionSubtitle}>Everything you need for secure, high-quality video communication.</p>
                </div>
                <div style={s.featuresGrid}>
                    {features.map((f, i) => (
                        <div key={i} style={s.featureCard}>
                            <div style={{ ...s.featureIconWrap, background: f.bg, color: f.color }}>
                                {f.icon}
                            </div>
                            <h3 style={s.featureTitle}>{f.title}</h3>
                            <p style={s.featureDesc}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section style={s.ctaSection}>
                <div style={s.ctaCard}>
                    <img src="/vossle-logo.svg" alt="Vossle" style={{ width: 48, height: 48, marginBottom: '8px' }} />
                    <h2 style={s.ctaTitle}>Ready to connect?</h2>
                    <p style={s.ctaText}>Create your free account and start a call in under 30 seconds.</p>
                    <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-primary btn-lg" style={s.ctaPrimary}>
                        {isAuthenticated ? 'Go to Dashboard' : 'Start Free'}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer style={s.footer}>
                <div style={s.footerInner}>
                    <div style={s.footerBrand}>
                        <img src="/vossle-logo.svg" alt="Vossle" style={{ width: 24, height: 24 }} />
                        <span style={s.footerBrandName}>Vossle</span>
                    </div>
                    <span style={s.footerText}>© 2026 Vossle. Built for professionals who demand the best.</span>
                </div>
            </footer>
        </div>
    );
};

const s = {
    page: { flex: 1, display: 'flex', flexDirection: 'column' },

    /* Hero */
    hero: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '60px',
        padding: '80px 32px 60px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        flexWrap: 'wrap',
    },
    heroInner: { maxWidth: '540px', flex: 1, minWidth: '320px' },
    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        fontSize: '0.75rem',
        fontWeight: 500,
        color: '#818cf8',
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: '20px',
        marginBottom: '24px',
    },
    badgeDot: {
        width: '6px', height: '6px', borderRadius: '50%',
        background: '#22c55e', animation: 'pulse 2s infinite',
    },
    title: {
        fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
        fontWeight: 800, lineHeight: 1.12,
        color: '#f0f0f5', marginBottom: '20px', letterSpacing: '-1px',
    },
    titleGradient: {
        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    },
    subtitle: {
        fontSize: '1.05rem', lineHeight: 1.7,
        color: '#9191a8', marginBottom: '32px',
    },
    ctas: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
    ctaPrimary: { display: 'inline-flex', alignItems: 'center', gap: '8px' },

    /* Hero visual */
    heroVisual: { flex: 1, minWidth: '340px', maxWidth: '500px' },
    mockWindow: {
        borderRadius: '16px', overflow: 'hidden',
        background: 'rgba(18,18,26,0.8)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
    },
    mockDots: {
        display: 'flex', gap: '6px', padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
    },
    dot: { width: '10px', height: '10px', borderRadius: '50%' },
    mockContent: { padding: '20px' },
    mockVideoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' },
    mockVideoTile: {
        aspectRatio: '4/3', borderRadius: '10px',
        background: 'linear-gradient(145deg, #16161f, #0d0d14)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '8px',
        position: 'relative',
    },
    mockAvatar: {
        width: '48px', height: '48px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #818cf8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: '0.9rem',
    },
    mockNameTag: {
        fontSize: '0.7rem', color: '#9191a8', fontWeight: 500,
    },
    mockControls: {
        display: 'flex', justifyContent: 'center', gap: '8px',
    },
    mockControlBtn: {
        width: '36px', height: '36px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.06)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem',
    },

    /* Stats */
    statsSection: {
        display: 'flex', justifyContent: 'center', gap: '40px',
        padding: '40px 32px', borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        flexWrap: 'wrap', maxWidth: '900px', margin: '0 auto', width: '100%',
    },
    statItem: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '4px', minWidth: '100px',
    },
    statValue: {
        fontSize: '1.4rem', fontWeight: 800, color: '#f0f0f5',
        fontFamily: "'JetBrains Mono', monospace",
    },
    statLabel: { fontSize: '0.75rem', color: '#5e5e73', fontWeight: 500 },

    /* Features */
    featuresSection: {
        padding: '60px 32px', maxWidth: '1100px',
        margin: '0 auto', width: '100%',
    },
    featuresSectionHeader: {
        textAlign: 'center', marginBottom: '40px',
    },
    sectionTitle: {
        fontSize: '1.8rem', fontWeight: 700, color: '#f0f0f5', marginBottom: '8px',
    },
    sectionSubtitle: {
        fontSize: '0.95rem', color: '#5e5e73',
    },
    featuresGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
    },
    featureCard: {
        padding: '24px', borderRadius: '16px',
        background: 'rgba(18,18,26,0.5)',
        border: '1px solid rgba(255,255,255,0.04)',
        transition: 'transform 200ms, border-color 200ms',
    },
    featureIconWrap: {
        width: '44px', height: '44px', borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '14px',
    },
    featureTitle: {
        fontSize: '0.95rem', fontWeight: 600, color: '#f0f0f5', marginBottom: '6px',
    },
    featureDesc: {
        fontSize: '0.82rem', color: '#9191a8', lineHeight: 1.6,
    },

    /* CTA bottom */
    ctaSection: {
        padding: '40px 32px 60px',
        display: 'flex', justifyContent: 'center',
    },
    ctaCard: {
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        maxWidth: '500px', padding: '48px 40px',
        background: 'linear-gradient(145deg, rgba(99,102,241,0.06), rgba(6,182,212,0.04))',
        border: '1px solid rgba(99,102,241,0.1)',
        borderRadius: '20px',
    },
    ctaTitle: {
        fontSize: '1.5rem', fontWeight: 700, color: '#f0f0f5', marginBottom: '8px',
    },
    ctaText: {
        fontSize: '0.9rem', color: '#9191a8', marginBottom: '24px', lineHeight: 1.5,
    },

    /* Footer */
    footer: {
        padding: '24px 32px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
    },
    footerInner: {
        maxWidth: '1100px', margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '12px',
    },
    footerBrand: {
        display: 'flex', alignItems: 'center', gap: '8px',
    },
    footerBrandName: {
        fontSize: '0.9rem', fontWeight: 700, color: '#5e5e73',
    },
    footerText: {
        color: '#3a3a48', fontSize: '0.75rem',
    },
};

export default Landing;
