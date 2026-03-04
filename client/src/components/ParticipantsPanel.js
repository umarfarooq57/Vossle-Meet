/**
 * Vossle — Participants Panel
 * Shows connected participants with their status indicators.
 */

import React from 'react';

const ParticipantsPanel = ({
    participants = [],
    currentUserId,
    hostId,
    roomCode,
    onClose,
    onInvite,
    onMuteParticipant,
    onRemoveParticipant,
}) => {
    const [copied, setCopied] = React.useState(false);

    const handleInvite = () => {
        if (roomCode) {
            navigator.clipboard?.writeText(roomCode).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }).catch(() => { });
        }
        if (onInvite) onInvite();
    };
    return (
        <div style={s.panel}>
            {/* Header */}
            <div style={s.header}>
                <div style={s.headerLeft}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <h3 style={s.title}>Participants ({participants.length})</h3>
                </div>
                <button onClick={onClose} style={s.closeBtn}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
            </div>

            {/* Search / Invite */}
            <div style={s.searchSection}>
                <button style={s.inviteBtn} onClick={handleInvite}>
                    {copied ? (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span style={{ color: '#22c55e' }}>Code Copied!</span>
                        </>
                    ) : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="8.5" cy="7" r="4" />
                                <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                            </svg>
                            <span>Invite People</span>
                        </>
                    )}
                </button>
                {roomCode && (
                    <div style={s.roomCodeDisplay}>
                        <span style={s.roomCodeLabel}>Room Code:</span>
                        <span style={s.roomCodeValue}>{roomCode}</span>
                    </div>
                )}
            </div>

            {/* Participants list */}
            <div style={s.list}>
                {/* In call section */}
                <div style={s.sectionLabel}>In this meeting ({participants.length})</div>
                {participants.map((p) => {
                    const isMe = p.id === currentUserId;
                    const isHost = p.id === hostId;
                    return (
                        <div key={p.id} style={s.participantRow}>
                            <div style={s.participantLeft}>
                                <div style={s.avatar}>
                                    {p.name ? p.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'}
                                </div>
                                <div style={s.nameSection}>
                                    <div style={s.nameRow}>
                                        <span style={s.name}>{p.name}{isMe ? ' (You)' : ''}</span>
                                        {isHost && <span style={s.hostBadge}>Host</span>}
                                    </div>
                                </div>
                            </div>
                            <div style={s.indicators}>
                                {/* Audio indicator */}
                                {p.isAudioEnabled === false && (
                                    <div style={s.mutedIndicator}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                                        </svg>
                                    </div>
                                )}
                                {/* Video indicator */}
                                {p.isVideoEnabled === false && (
                                    <div style={s.mutedIndicator}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const s = {
    panel: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(18, 18, 26, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    title: {
        fontSize: '0.85rem',
        fontWeight: 600,
        color: '#f0f0f5',
    },
    closeBtn: {
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        color: '#5e5e73',
        cursor: 'pointer',
        borderRadius: '6px',
    },
    searchSection: {
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
    },
    inviteBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '10px 14px',
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '10px',
        color: '#818cf8',
        fontSize: '0.82rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 150ms',
        fontFamily: "'Inter', sans-serif",
    },
    roomCodeDisplay: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '8px',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.04)',
    },
    roomCodeLabel: {
        fontSize: '0.7rem',
        color: '#5e5e73',
        fontWeight: 500,
    },
    roomCodeValue: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.78rem',
        fontWeight: 600,
        color: '#818cf8',
        letterSpacing: '1.5px',
    },
    list: {
        flex: 1,
        overflowY: 'auto',
        padding: '8px 10px',
    },
    sectionLabel: {
        fontSize: '0.68rem',
        fontWeight: 600,
        color: '#5e5e73',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        padding: '8px 8px 6px',
    },
    participantRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px',
        borderRadius: '8px',
        transition: 'background 150ms',
    },
    participantLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    avatar: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.7rem',
        fontWeight: 700,
        color: 'white',
        flexShrink: 0,
    },
    nameSection: {
        display: 'flex',
        flexDirection: 'column',
    },
    nameRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    name: {
        fontSize: '0.82rem',
        fontWeight: 500,
        color: '#f0f0f5',
    },
    hostBadge: {
        fontSize: '0.6rem',
        fontWeight: 600,
        padding: '2px 6px',
        borderRadius: '4px',
        background: 'rgba(99, 102, 241, 0.15)',
        color: '#818cf8',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    indicators: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    mutedIndicator: {
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: 'rgba(239, 68, 68, 0.1)',
    },
};

export default ParticipantsPanel;
