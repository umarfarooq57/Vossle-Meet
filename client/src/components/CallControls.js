/**
 * Vossle — Call Controls v2
 * Zoom/Meet-style bottom control bar with SVG icons and tooltips.
 */

import React, { useState, useEffect } from 'react';

/* ── SVG Icon Components ── */
const MicOn = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);
const MicOff = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.36 2.18" />
        <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);
const CamOn = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
);
const CamOff = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);
const ScreenIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
);
const ChatIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);
const ParticipantsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
const HandIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 11V6a2 2 0 0 0-4 0v2" /><path d="M14 10V4a2 2 0 0 0-4 0v6" />
        <path d="M10 10.5V2a2 2 0 0 0-4 0v8.5" /><path d="M18 8a2 2 0 0 1 4 0v6a8 8 0 0 1-8 8h-2c-2.5 0-4.5-1-6.2-2.8L3 16.8" />
    </svg>
);
const ReactIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
);
const PhoneOff = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
        <line x1="23" y1="1" x2="1" y2="23" />
    </svg>
);
const MoreIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="1.5" /><circle cx="6" cy="12" r="1.5" /><circle cx="18" cy="12" r="1.5" />
    </svg>
);
const RecordIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="8" />
    </svg>
);

const CallControls = ({
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isRecording = false,
    isHandRaised = false,
    connectionState,
    participantCount = 1,
    onToggleAudio,
    onToggleVideo,
    onToggleScreenShare,
    onEndCall,
    onToggleChat,
    onToggleParticipants,
    onToggleHandRaise,
    onReaction,
    hasUnreadChat = false,
    chatOpen = false,
    participantsOpen = false,
    meetingDuration = 0,
}) => {
    const [showReactions, setShowReactions] = useState(false);
    const [showMore, setShowMore] = useState(false);

    // Close reaction panel on click elsewhere
    useEffect(() => {
        const close = () => { setShowReactions(false); setShowMore(false); };
        if (showReactions || showMore) {
            document.addEventListener('click', close);
            return () => document.removeEventListener('click', close);
        }
    }, [showReactions, showMore]);

    const formatDuration = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const reactions = ['👍', '👏', '😂', '❤️', '🎉', '😮'];

    return (
        <div style={s.wrapper}>
            <div style={s.container}>
                {/* Left: Meeting info */}
                <div style={s.leftSection}>
                    <div style={s.meetingInfo}>
                        {isRecording && (
                            <div style={s.recordingBadge}>
                                <span style={s.recordDot}><RecordIcon /></span>
                                <span style={s.recordText}>REC</span>
                            </div>
                        )}
                        <span style={s.timer}>{formatDuration(meetingDuration)}</span>
                        <div style={s.connectionIndicator}>
                            <div style={{
                                ...s.connDot,
                                background: connectionState === 'connected' ? '#22c55e'
                                    : connectionState === 'connecting' ? '#f59e0b' : '#ef4444',
                            }} />
                        </div>
                    </div>
                </div>

                {/* Center: Main controls */}
                <div style={s.centerSection}>
                    {/* Mic */}
                    <button
                        onClick={onToggleAudio}
                        style={{
                            ...s.controlBtn,
                            ...(isAudioEnabled ? s.controlBtnDefault : s.controlBtnOff),
                        }}
                        title={isAudioEnabled ? 'Mute (Alt+A)' : 'Unmute (Alt+A)'}
                    >
                        {isAudioEnabled ? <MicOn /> : <MicOff />}
                    </button>

                    {/* Camera */}
                    <button
                        onClick={onToggleVideo}
                        style={{
                            ...s.controlBtn,
                            ...(isVideoEnabled ? s.controlBtnDefault : s.controlBtnOff),
                        }}
                        title={isVideoEnabled ? 'Stop Video (Alt+V)' : 'Start Video (Alt+V)'}
                    >
                        {isVideoEnabled ? <CamOn /> : <CamOff />}
                    </button>

                    {/* Screen Share */}
                    <button
                        onClick={onToggleScreenShare}
                        style={{
                            ...s.controlBtn,
                            ...(isScreenSharing ? s.controlBtnActive : s.controlBtnDefault),
                        }}
                        title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                    >
                        <ScreenIcon />
                    </button>

                    {/* Reactions */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowReactions(!showReactions); }}
                            style={{ ...s.controlBtn, ...s.controlBtnDefault }}
                            title="Reactions"
                        >
                            <ReactIcon />
                        </button>
                        {showReactions && (
                            <div style={s.reactionPopup} onClick={e => e.stopPropagation()}>
                                {reactions.map(r => (
                                    <button
                                        key={r}
                                        style={s.reactionBtn}
                                        onClick={() => { onReaction?.(r); setShowReactions(false); }}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Hand Raise */}
                    <button
                        onClick={onToggleHandRaise}
                        style={{
                            ...s.controlBtn,
                            ...(isHandRaised ? s.controlBtnActive : s.controlBtnDefault),
                        }}
                        title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
                    >
                        <HandIcon />
                    </button>

                    {/* End Call */}
                    <button
                        onClick={onEndCall}
                        style={s.endCallBtn}
                        title="Leave Meeting"
                    >
                        <PhoneOff />
                    </button>
                </div>

                {/* Right: Side panel toggles */}
                <div style={s.rightSection}>
                    {/* Participants */}
                    <button
                        onClick={onToggleParticipants}
                        style={{
                            ...s.controlBtn,
                            ...s.controlBtnSmall,
                            ...(participantsOpen ? s.controlBtnActive : s.controlBtnDefault),
                        }}
                        title="Participants"
                    >
                        <ParticipantsIcon />
                        <span style={s.badgeCount}>{participantCount}</span>
                    </button>

                    {/* Chat */}
                    <button
                        onClick={onToggleChat}
                        style={{
                            ...s.controlBtn,
                            ...s.controlBtnSmall,
                            ...(chatOpen ? s.controlBtnActive : s.controlBtnDefault),
                            position: 'relative',
                        }}
                        title="Chat"
                    >
                        <ChatIcon />
                        {hasUnreadChat && <span style={s.unreadDot} />}
                    </button>

                    {/* More */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); }}
                            style={{ ...s.controlBtn, ...s.controlBtnSmall, ...s.controlBtnDefault }}
                            title="More options"
                        >
                            <MoreIcon />
                        </button>
                        {showMore && (
                            <div style={s.morePopup} onClick={e => e.stopPropagation()}>
                                <button style={s.moreItem}>
                                    <RecordIcon /> <span>Record Meeting</span>
                                </button>
                                <button style={s.moreItem}>
                                    <ScreenIcon /> <span>Meeting Settings</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const s = {
    wrapper: {
        padding: '0 16px 16px',
        position: 'relative',
        zIndex: 20,
    },
    container: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 20px',
        background: 'rgba(18, 18, 26, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.3)',
    },
    leftSection: {
        display: 'flex',
        alignItems: 'center',
        minWidth: '160px',
    },
    meetingInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    recordingBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '4px',
        background: 'rgba(239, 68, 68, 0.15)',
    },
    recordDot: {
        color: '#ef4444',
        animation: 'pulse 1.5s infinite',
        display: 'flex',
    },
    recordText: {
        color: '#ef4444',
        fontSize: '0.68rem',
        fontWeight: 700,
        letterSpacing: '1px',
    },
    timer: {
        color: '#9191a8',
        fontSize: '0.82rem',
        fontWeight: 500,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.5px',
    },
    connectionIndicator: {
        display: 'flex',
        alignItems: 'center',
    },
    connDot: {
        width: '7px',
        height: '7px',
        borderRadius: '50%',
    },
    centerSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    controlBtn: {
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 150ms ease',
        position: 'relative',
        outline: 'none',
    },
    controlBtnDefault: {
        background: 'rgba(255,255,255,0.06)',
        color: '#f0f0f5',
    },
    controlBtnOff: {
        background: '#ef4444',
        color: 'white',
    },
    controlBtnActive: {
        background: 'rgba(99, 102, 241, 0.2)',
        color: '#818cf8',
        border: '1px solid rgba(99, 102, 241, 0.3)',
    },
    controlBtnSmall: {
        width: '44px',
        height: '44px',
        borderRadius: '10px',
    },
    endCallBtn: {
        width: '56px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: 'white',
        marginLeft: '4px',
        transition: 'all 150ms ease',
        boxShadow: '0 0 20px rgba(239, 68, 68, 0.25)',
    },
    badgeCount: {
        position: 'absolute',
        top: '2px',
        right: '2px',
        fontSize: '0.6rem',
        fontWeight: 700,
        color: '#818cf8',
        minWidth: '14px',
        textAlign: 'center',
    },
    unreadDot: {
        position: 'absolute',
        top: '6px',
        right: '6px',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#ef4444',
        border: '2px solid #12121a',
    },
    rightSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        minWidth: '160px',
        justifyContent: 'flex-end',
    },
    reactionPopup: {
        position: 'absolute',
        bottom: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '4px',
        padding: '8px',
        background: 'rgba(18,18,26,0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        animation: 'fadeInUp 200ms ease',
    },
    reactionBtn: {
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.3rem',
        background: 'transparent',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 150ms ease',
    },
    morePopup: {
        position: 'absolute',
        bottom: '60px',
        right: 0,
        minWidth: '200px',
        padding: '6px',
        background: 'rgba(18,18,26,0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        animation: 'fadeInUp 200ms ease',
    },
    moreItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '10px 14px',
        background: 'transparent',
        border: 'none',
        borderRadius: '8px',
        color: '#f0f0f5',
        fontSize: '0.82rem',
        cursor: 'pointer',
        transition: 'background 150ms',
    },
};

export default CallControls;
