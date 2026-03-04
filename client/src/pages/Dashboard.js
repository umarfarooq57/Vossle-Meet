/**
 * Vossle — Dashboard v2
 * Professional meeting hub — create, join, browse history.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api.service';

/* ── SVG Icons ── */
const VideoIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
);
const LinkIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 7h3a5 5 0 0 1 0 10h-3m-6 0H6A5 5 0 0 1 6 7h3" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
);
const ClockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);
const CalendarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);
const ArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
);

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [title, setTitle] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const h = new Date().getHours();
        setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
    }, []);

    const fetchSessions = useCallback(async () => {
        try {
            const data = await api.listSessions();
            setSessions(data.sessions || []);
        } catch {
            // Ignore
        }
    }, []);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    const handleCreateSession = async () => {
        setError('');
        setLoading(true);
        try {
            const data = await api.createSession(title || 'Vossle Meeting');
            navigate(`/room/${data.session.id}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinByCode = async (e) => {
        e.preventDefault();
        setError('');
        if (!roomCode.trim()) return;
        setLoading(true);
        try {
            const data = await api.getSessionByRoom(roomCode.trim());
            navigate(`/room/${data.session.id}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const activeSessions = sessions.filter(s => s.status === 'active' || s.status === 'created');
    const pastSessions = sessions.filter(s => s.status === 'ended');

    return (
        <div style={st.page}>
            <div style={st.content}>
                {/* Header */}
                <header style={st.header}>
                    <div>
                        <h1 style={st.greeting}>{greeting}, {user?.name?.split(' ')[0]}</h1>
                        <p style={st.subtitle}>Start or join a secure video meeting.</p>
                    </div>
                    <div style={st.headerAvatar}>
                        {user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                    </div>
                </header>

                {error && (
                    <div style={st.error}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Quick Actions */}
                <div style={st.actionGrid}>
                    {/* New Meeting */}
                    <div style={st.actionCard}>
                        <div style={st.actionHeader}>
                            <div style={{ ...st.actionIconWrap, background: 'rgba(99, 102, 241, 0.12)' }}>
                                <div style={{ color: '#818cf8' }}><VideoIcon /></div>
                            </div>
                            <div>
                                <h2 style={st.actionTitle}>New Meeting</h2>
                                <p style={st.actionDesc}>Create a room and share the code</p>
                            </div>
                        </div>
                        <div style={st.actionBody}>
                            <div style={st.inputRow}>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Meeting title (optional)"
                                    maxLength={100}
                                    style={st.input}
                                />
                            </div>
                            <button
                                onClick={handleCreateSession}
                                className="btn btn-primary"
                                style={st.actionBtn}
                                disabled={loading}
                            >
                                {loading ? <span className="spinner" /> : (
                                    <>
                                        <VideoIcon />
                                        <span>Start Meeting</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Join Meeting */}
                    <div style={st.actionCard}>
                        <div style={st.actionHeader}>
                            <div style={{ ...st.actionIconWrap, background: 'rgba(6, 182, 212, 0.12)' }}>
                                <div style={{ color: '#22d3ee' }}><LinkIcon /></div>
                            </div>
                            <div>
                                <h2 style={st.actionTitle}>Join Meeting</h2>
                                <p style={st.actionDesc}>Enter a room code shared with you</p>
                            </div>
                        </div>
                        <form onSubmit={handleJoinByCode} style={st.actionBody}>
                            <div style={st.inputRow}>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value)}
                                    placeholder="e.g. ab3k-m7qr-x2np"
                                    style={{ ...st.input, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px' }}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-secondary"
                                style={st.actionBtn}
                                disabled={loading || !roomCode.trim()}
                            >
                                <ArrowIcon />
                                <span>Join</span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Active Meetings */}
                {activeSessions.length > 0 && (
                    <section style={st.section}>
                        <div style={st.sectionHeader}>
                            <div style={st.sectionDot} />
                            <h3 style={st.sectionTitle}>Active Meetings</h3>
                            <span style={st.sectionCount}>{activeSessions.length}</span>
                        </div>
                        <div style={st.sessionList}>
                            {activeSessions.map((sess) => (
                                <div key={sess.id} style={st.sessionCard}>
                                    <div style={st.sessionInfo}>
                                        <div style={st.sessionIconWrap}>
                                            <VideoIcon />
                                        </div>
                                        <div>
                                            <h4 style={st.sessionName}>{sess.title}</h4>
                                            <div style={st.sessionMeta}>
                                                <span style={st.sessionCode}>{sess.roomCode}</span>
                                                <span style={st.metaDot}>•</span>
                                                <CalendarIcon />
                                                <span>{new Date(sess.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={st.sessionActions}>
                                        <span style={st.activeBadge}>
                                            <span style={st.activeDot} />
                                            Live
                                        </span>
                                        <button onClick={() => navigate(`/room/${sess.id}`)} className="btn btn-primary btn-sm">
                                            Rejoin
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Past Sessions */}
                {pastSessions.length > 0 && (
                    <section style={st.section}>
                        <div style={st.sectionHeader}>
                            <ClockIcon />
                            <h3 style={st.sectionTitle}>Recent Meetings</h3>
                            <span style={st.sectionCount}>{pastSessions.length}</span>
                        </div>
                        <div style={st.sessionList}>
                            {pastSessions.slice(0, 8).map((sess) => (
                                <div key={sess.id} style={{ ...st.sessionCard, opacity: 0.75 }}>
                                    <div style={st.sessionInfo}>
                                        <div style={{ ...st.sessionIconWrap, background: 'rgba(255,255,255,0.03)' }}>
                                            <ClockIcon />
                                        </div>
                                        <div>
                                            <h4 style={st.sessionName}>{sess.title}</h4>
                                            <div style={st.sessionMeta}>
                                                <span style={st.sessionCode}>{sess.roomCode}</span>
                                                <span style={st.metaDot}>•</span>
                                                <span>{new Date(sess.createdAt).toLocaleDateString()}</span>
                                                {sess.duration && (
                                                    <>
                                                        <span style={st.metaDot}>•</span>
                                                        <span>{Math.round(sess.duration / 60)} min</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <span style={st.endedBadge}>Ended</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty state */}
                {sessions.length === 0 && (
                    <div style={st.emptyState}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#5e5e73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                        <h3 style={st.emptyTitle}>No meetings yet</h3>
                        <p style={st.emptyText}>Create your first meeting to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const st = {
    page: { flex: 1, padding: '24px', overflowY: 'auto' },
    content: { maxWidth: '880px', margin: '0 auto' },

    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
    },
    greeting: {
        fontSize: '1.6rem',
        fontWeight: 700,
        color: '#f0f0f5',
        marginBottom: '4px',
    },
    subtitle: { color: '#5e5e73', fontSize: '0.9rem' },
    headerAvatar: {
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: '0.85rem',
        flexShrink: 0,
    },

    error: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        color: '#ef4444',
        padding: '10px 14px',
        borderRadius: '10px',
        fontSize: '0.82rem',
        marginBottom: '20px',
    },

    actionGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '16px',
        marginBottom: '36px',
    },
    actionCard: {
        background: 'rgba(18, 18, 26, 0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    actionHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
    },
    actionIconWrap: {
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    actionTitle: {
        fontSize: '1rem',
        fontWeight: 600,
        color: '#f0f0f5',
        marginBottom: '2px',
    },
    actionDesc: {
        fontSize: '0.78rem',
        color: '#5e5e73',
    },
    actionBody: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    inputRow: {},
    input: {
        width: '100%',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        padding: '12px 14px',
        color: '#f0f0f5',
        fontSize: '0.88rem',
        outline: 'none',
        fontFamily: "'Inter', sans-serif",
    },
    actionBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        padding: '12px 20px',
        fontSize: '0.88rem',
    },

    section: { marginBottom: '28px' },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        color: '#9191a8',
    },
    sectionDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#22c55e',
        animation: 'pulse 2s infinite',
    },
    sectionTitle: {
        fontSize: '0.88rem',
        fontWeight: 600,
        color: '#c0c0d0',
    },
    sectionCount: {
        fontSize: '0.7rem',
        fontWeight: 600,
        color: '#5e5e73',
        background: 'rgba(255,255,255,0.04)',
        padding: '2px 8px',
        borderRadius: '10px',
    },
    sessionList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    sessionCard: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        background: 'rgba(18, 18, 26, 0.5)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: '12px',
        transition: 'all 150ms',
    },
    sessionInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flex: 1,
        minWidth: 0,
    },
    sessionIconWrap: {
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: 'rgba(99,102,241,0.08)',
        color: '#818cf8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    sessionName: {
        fontSize: '0.88rem',
        fontWeight: 500,
        color: '#f0f0f5',
        marginBottom: '3px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    sessionMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '0.72rem',
        color: '#5e5e73',
    },
    sessionCode: {
        fontFamily: "'JetBrains Mono', monospace",
        color: '#818cf8',
        fontSize: '0.72rem',
    },
    metaDot: { color: '#3a3a48' },
    sessionActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
    },
    activeBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '0.7rem',
        fontWeight: 600,
        color: '#22c55e',
        background: 'rgba(34, 197, 94, 0.08)',
        padding: '4px 10px',
        borderRadius: '10px',
    },
    activeDot: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: '#22c55e',
        animation: 'pulse 2s infinite',
    },
    endedBadge: {
        fontSize: '0.7rem',
        fontWeight: 600,
        color: '#5e5e73',
        background: 'rgba(255,255,255,0.03)',
        padding: '4px 10px',
        borderRadius: '10px',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '48px',
        gap: '12px',
        textAlign: 'center',
    },
    emptyTitle: { fontSize: '1rem', fontWeight: 600, color: '#9191a8' },
    emptyText: { fontSize: '0.82rem', color: '#5e5e73' },
};

export default Dashboard;
