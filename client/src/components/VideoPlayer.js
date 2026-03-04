/**
 * Vossle — Video Player Component v2
 * Professional video tile with avatar, indicators, and status overlays.
 */

import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({
    videoRef: externalRef,
    stream,
    muted = false,
    mirror = false,
    name = '',
    isLocal = false,
    isVideoEnabled = true,
    isAudioEnabled = true,
    isSpeaking = false,
    isPinned = false,
    connectionQuality = null, // 'good' | 'fair' | 'poor'
    style = {},
}) => {
    const internalRef = useRef(null);
    const ref = externalRef || internalRef;

    useEffect(() => {
        if (ref.current && stream) {
            ref.current.srcObject = stream;
        }
    }, [stream, ref]);

    const initials = name
        ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    const qualityColor = connectionQuality === 'good' ? '#22c55e'
        : connectionQuality === 'fair' ? '#f59e0b' : connectionQuality === 'poor' ? '#ef4444' : null;

    return (
        <div style={{
            ...s.container,
            ...(isSpeaking ? s.speaking : {}),
            ...style,
        }}>
            {/* Video element */}
            <video
                ref={ref}
                autoPlay
                playsInline
                muted={muted}
                style={{
                    ...s.video,
                    transform: mirror ? 'scaleX(-1)' : 'none',
                    opacity: isVideoEnabled && stream ? 1 : 0,
                }}
            />

            {/* Avatar fallback */}
            {(!isVideoEnabled || !stream) && (
                <div style={s.avatarWrap}>
                    <div style={s.avatarRing}>
                        <div style={s.avatar}>{initials}</div>
                    </div>
                    {!isVideoEnabled && <span style={s.camOffText}>Camera off</span>}
                </div>
            )}

            {/* Bottom bar overlay */}
            <div style={s.bottomBar}>
                <div style={s.nameSection}>
                    {!isAudioEnabled && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="1" y1="1" x2="23" y2="23" />
                            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.36 2.18" />
                        </svg>
                    )}
                    <span style={s.nameText}>
                        {name || (isLocal ? 'You' : 'Participant')}
                        {isLocal && ' (You)'}
                    </span>
                </div>
                {qualityColor && (
                    <div style={s.qualityDots}>
                        <div style={{ ...s.qualityBar, height: '6px', background: qualityColor }} />
                        <div style={{ ...s.qualityBar, height: '10px', background: connectionQuality !== 'poor' ? qualityColor : '#333' }} />
                        <div style={{ ...s.qualityBar, height: '14px', background: connectionQuality === 'good' ? qualityColor : '#333' }} />
                    </div>
                )}
            </div>

            {/* Pin icon */}
            {isPinned && (
                <div style={s.pinBadge}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" /></svg>
                </div>
            )}
        </div>
    );
};

const s = {
    container: {
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#16161f',
        border: '2px solid transparent',
        transition: 'border-color 200ms ease, box-shadow 200ms ease',
    },
    speaking: {
        borderColor: 'rgba(99, 102, 241, 0.6)',
        boxShadow: '0 0 0 1px rgba(99, 102, 241, 0.3), 0 0 20px rgba(99, 102, 241, 0.15)',
    },
    video: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        position: 'absolute',
        top: 0,
        left: 0,
        transition: 'opacity 300ms ease',
    },
    avatarWrap: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        background: 'linear-gradient(145deg, #16161f, #0d0d14)',
    },
    avatarRing: {
        padding: '3px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    },
    avatar: {
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        background: '#1a1a28',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.6rem',
        fontWeight: 700,
        color: '#f0f0f5',
        letterSpacing: '1px',
    },
    camOffText: {
        color: '#5e5e73',
        fontSize: '0.75rem',
        fontWeight: 500,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
    },
    nameSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    nameText: {
        color: '#f0f0f5',
        fontSize: '0.78rem',
        fontWeight: 500,
        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
    },
    qualityDots: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: '2px',
    },
    qualityBar: {
        width: '3px',
        borderRadius: '1px',
    },
    pinBadge: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: 'rgba(99, 102, 241, 0.9)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
};

export default VideoPlayer;
