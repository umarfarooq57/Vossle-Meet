/**
 * Vossle — Video Room v2
 * Full Zoom/Meet-class video call experience.
 * Pre-call lobby → Active call → Post-call, with all panels and features.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useWebRTC from '../hooks/useWebRTC';
import socketService from '../services/socket.service';
import api from '../services/api.service';
import VideoPlayer from '../components/VideoPlayer';
import CallControls from '../components/CallControls';
import ChatPanel from '../components/ChatPanel';
import ParticipantsPanel from '../components/ParticipantsPanel';

const Room = () => {
    const { id: sessionId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Room / session state
    const [session, setSession] = useState(null);
    const [status, setStatus] = useState('loading'); // loading | lobby | connecting | connected | ended
    const [error, setError] = useState('');
    const [remoteUserName, setRemoteUserName] = useState('');

    // Panels
    const [chatOpen, setChatOpen] = useState(false);
    const [participantsOpen, setParticipantsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [hasUnread, setHasUnread] = useState(false);
    const [participants, setParticipants] = useState([]);

    // Features
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [reactions, setReactions] = useState([]); // floating reactions
    const [meetingDuration, setMeetingDuration] = useState(0);
    const [copied, setCopied] = useState(false);

    // Lobby state (pre-call)
    const [lobbyAudioEnabled, setLobbyAudioEnabled] = useState(true);
    const [lobbyVideoEnabled, setLobbyVideoEnabled] = useState(true);

    // Admission control
    const [joinRequests, setJoinRequests] = useState([]); // host sees these
    const [waitingForAdmission, setWaitingForAdmission] = useState(false); // joiner sees this
    const [admissionDenied, setAdmissionDenied] = useState(false);

    const {
        localStream,
        remoteStream,
        connectionState,
        isAudioEnabled,
        isVideoEnabled,
        isScreenSharing,
        qualityMetrics,
        localVideoRef,
        remoteVideoRef,
        initializeMedia,
        startCall,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
        endCall,
    } = useWebRTC(sessionId);

    const hasInitialized = useRef(false);
    const meetingTimerRef = useRef(null);
    const lobbyVideoRef = useRef(null);
    const chatOpenRef = useRef(chatOpen);

    // Keep chatOpenRef in sync
    useEffect(() => { chatOpenRef.current = chatOpen; }, [chatOpen]);

    // ── Meeting duration timer ──
    useEffect(() => {
        if (status === 'connected') {
            meetingTimerRef.current = setInterval(() => {
                setMeetingDuration(prev => prev + 1);
            }, 1000);
        }
        return () => { if (meetingTimerRef.current) clearInterval(meetingTimerRef.current); };
    }, [status]);

    // ── Initialize lobby: fetch session info + start camera preview ──
    useEffect(() => {
        const initLobby = async () => {
            try {
                const sessionData = await api.getSession(sessionId);
                setSession(sessionData.session);

                // Start camera preview for lobby
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                    });
                    if (lobbyVideoRef.current) lobbyVideoRef.current.srcObject = stream;
                    // Store stream to stop later
                    lobbyVideoRef.current._stream = stream;
                } catch {
                    setLobbyVideoEnabled(false);
                }

                setStatus('lobby');
            } catch (err) {
                setError(err.message || 'Failed to load room.');
                setStatus('ended');
            }
        };
        initLobby();

        return () => {
            // Cleanup lobby preview
            if (lobbyVideoRef.current?._stream) {
                lobbyVideoRef.current._stream.getTracks().forEach(t => t.stop());
            }
        };
    }, [sessionId]);

    // ── Join meeting (from lobby) ──
    const joinMeeting = useCallback(async () => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        try {
            setStatus('connecting');

            // Stop lobby preview
            if (lobbyVideoRef.current?._stream) {
                lobbyVideoRef.current._stream.getTracks().forEach(t => t.stop());
            }

            // Join session via API
            await api.joinSession(sessionId);

            // Initialize real media
            const stream = await initializeMedia();

            // Apply lobby preferences
            if (!lobbyAudioEnabled) {
                stream.getAudioTracks().forEach(t => { t.enabled = false; });
            }
            if (!lobbyVideoEnabled) {
                stream.getVideoTracks().forEach(t => { t.enabled = false; });
            }

            // Connect socket and WAIT for it to be ready
            const token = api.getToken();
            await socketService.connect(token);

            // Setup handlers (socket is now connected)
            setupSignalingHandlers();

            // Join room via socket (socket is guaranteed connected)
            socketService.emit('room:join', { roomId: sessionId, sessionId });

            // Add self to participants
            setParticipants([{
                id: user?.id,
                name: user?.name,
                isAudioEnabled: lobbyAudioEnabled,
                isVideoEnabled: lobbyVideoEnabled,
            }]);

        } catch (err) {
            console.error('[Vossle Room] Join error:', err);
            setError(err.message || 'Failed to join meeting.');
            setStatus('ended');
        }
    }, [sessionId, initializeMedia, lobbyAudioEnabled, lobbyVideoEnabled, user]);

    // ── Signaling handlers ──
    const setupSignalingHandlers = useCallback(() => {
        const socket = socketService.getSocket();
        if (!socket) return;

        socket.on('room:joined', ({ existingUsers }) => {
            if (existingUsers?.length > 0) {
                const peer = existingUsers[0];
                setRemoteUserName(peer.userName);
                setStatus('connecting');
                startCall(peer.socketId);
                setParticipants(prev => [...prev, {
                    id: peer.socketId,
                    name: peer.userName,
                    isAudioEnabled: true,
                    isVideoEnabled: true,
                }]);
            }
        });

        socket.on('room:user-joined', ({ socketId, userName }) => {
            setRemoteUserName(userName);
            setStatus('connecting');
            startCall(socketId);
            setParticipants(prev => [...prev, {
                id: socketId,
                name: userName,
                isAudioEnabled: true,
                isVideoEnabled: true,
            }]);
        });

        socket.on('webrtc:offer', async ({ offer, senderSocketId, senderName }) => {
            setRemoteUserName(senderName);
            setStatus('connecting');
            await handleOffer(offer, senderSocketId);
        });

        socket.on('webrtc:answer', async ({ answer, senderSocketId }) => {
            await handleAnswer(answer, senderSocketId);
        });

        socket.on('webrtc:ice-candidate', async ({ candidate, senderSocketId }) => {
            await handleIceCandidate(candidate, senderSocketId);
        });

        socket.on('room:user-left', ({ userName, socketId }) => {
            setRemoteUserName('');
            setStatus('lobby');
            setParticipants(prev => prev.filter(p => p.id !== socketId));
        });

        socket.on('media:video-toggled', ({ enabled, socketId }) => {
            setParticipants(prev => prev.map(p => p.id === socketId ? { ...p, isVideoEnabled: enabled } : p));
        });

        socket.on('media:audio-toggled', ({ enabled, socketId }) => {
            setParticipants(prev => prev.map(p => p.id === socketId ? { ...p, isAudioEnabled: enabled } : p));
        });

        socket.on('chat:message', (message) => {
            setMessages(prev => [...prev, message]);
            if (!chatOpenRef.current) setHasUnread(true);
        });

        // ── Admission control ──
        // Host receives join requests
        socket.on('room:join-request', ({ requestSocketId, userName, userId }) => {
            setJoinRequests(prev => {
                // Avoid duplicates
                if (prev.some(r => r.requestSocketId === requestSocketId)) return prev;
                return [...prev, { requestSocketId, userName, userId }];
            });
        });

        // Joiner: waiting for host
        socket.on('room:waiting-admission', () => {
            setWaitingForAdmission(true);
        });

        // Joiner: host admitted you
        socket.on('room:admitted', () => {
            setWaitingForAdmission(false);
        });

        // Joiner: host rejected you
        socket.on('room:rejected', ({ reason }) => {
            setWaitingForAdmission(false);
            setAdmissionDenied(true);
            setError(reason || 'The host denied your request to join.');
        });

    }, [startCall, handleOffer, handleAnswer, handleIceCandidate]);

    // ── Connection state tracking ──
    useEffect(() => {
        if (connectionState === 'connected') {
            setStatus('connected');
        } else if (connectionState === 'failed' || connectionState === 'closed') {
            if (status === 'connected') setStatus('ended');
        }
    }, [connectionState, status]);

    // ── Admission control actions ──
    const handleAdmit = (requestSocketId) => {
        socketService.emit('room:admit', { requestSocketId, roomId: sessionId });
        setJoinRequests(prev => prev.filter(r => r.requestSocketId !== requestSocketId));
    };

    const handleReject = (requestSocketId) => {
        socketService.emit('room:reject', { requestSocketId, roomId: sessionId });
        setJoinRequests(prev => prev.filter(r => r.requestSocketId !== requestSocketId));
    };

    // ── Actions ──
    const handleEndCall = async () => {
        try { await api.endSession(sessionId); } catch { }
        endCall();
        socketService.emit('room:leave');
        navigate('/dashboard');
    };

    const handleSendMessage = (message) => {
        const socket = socketService.getSocket();
        if (socket?.connected) {
            socketService.emit('chat:message', { message });
        } else {
            // Offline / socket not ready — add message locally so user sees it
            setMessages(prev => [...prev, {
                id: Date.now().toString(36) + Math.random().toString(36).slice(2),
                senderId: user?.id,
                senderName: user?.name,
                message,
                timestamp: new Date().toISOString(),
            }]);
        }
    };

    const handleToggleChat = () => {
        setChatOpen(prev => !prev);
        setHasUnread(false);
        if (!chatOpen) setParticipantsOpen(false);
    };

    const handleToggleParticipants = () => {
        setParticipantsOpen(prev => !prev);
        if (!participantsOpen) setChatOpen(false);
    };

    const handleToggleHandRaise = () => {
        setIsHandRaised(prev => !prev);
        socketService.emit('media:hand-raise', { raised: !isHandRaised });
    };

    const handleReaction = (emoji) => {
        const id = Date.now();
        setReactions(prev => [...prev, { id, emoji }]);
        socketService.emit('reaction', { emoji });
        setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000);
    };

    const copyRoomCode = () => {
        if (session?.roomCode) {
            navigator.clipboard?.writeText(session.roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const connectionQuality = qualityMetrics?.connection?.roundTripTime
        ? (qualityMetrics.connection.roundTripTime < 0.1 ? 'good' : qualityMetrics.connection.roundTripTime < 0.3 ? 'fair' : 'poor')
        : null;

    const sidePanel = chatOpen || participantsOpen;

    // ── ERROR STATE ──
    if (error) {
        return (
            <div style={s.fullCenter}>
                <div style={s.errorCard}>
                    <div style={s.errorIconWrap}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    </div>
                    <h2 style={s.errorTitle}>Unable to Join Meeting</h2>
                    <p style={s.errorText}>{error}</p>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-lg" style={{ marginTop: '8px' }}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ── LOADING STATE ──
    if (status === 'loading') {
        return (
            <div style={s.fullCenter}>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div className="spinner spinner-lg" />
                    <p style={{ color: '#9191a8', fontSize: '0.9rem' }}>Preparing your meeting...</p>
                </div>
            </div>
        );
    }

    // ── PRE-CALL LOBBY ──
    if (status === 'lobby' && !hasInitialized.current) {
        return (
            <div style={s.lobbyPage}>
                <div style={s.lobbyContainer}>
                    {/* Left: Camera preview */}
                    <div style={s.lobbyLeft}>
                        <div style={s.lobbyPreview}>
                            <video
                                ref={lobbyVideoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    ...s.lobbyVideo,
                                    transform: 'scaleX(-1)',
                                    opacity: lobbyVideoEnabled ? 1 : 0,
                                }}
                            />
                            {!lobbyVideoEnabled && (
                                <div style={s.lobbyAvatarWrap}>
                                    <div style={s.lobbyAvatarRing}>
                                        <div style={s.lobbyAvatar}>
                                            {user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                                        </div>
                                    </div>
                                    <span style={s.lobbyCamOff}>Camera is off</span>
                                </div>
                            )}
                            {/* Preview controls */}
                            <div style={s.lobbyControls}>
                                <button
                                    onClick={() => {
                                        setLobbyAudioEnabled(p => !p);
                                        if (lobbyVideoRef.current?._stream) {
                                            lobbyVideoRef.current._stream.getAudioTracks().forEach(t => { t.enabled = !lobbyAudioEnabled; });
                                        }
                                    }}
                                    style={{
                                        ...s.lobbyControlBtn,
                                        ...(lobbyAudioEnabled ? {} : s.lobbyControlBtnOff),
                                    }}
                                >
                                    {lobbyAudioEnabled ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                                        </svg>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setLobbyVideoEnabled(p => !p);
                                        if (lobbyVideoRef.current?._stream) {
                                            lobbyVideoRef.current._stream.getVideoTracks().forEach(t => { t.enabled = !lobbyVideoEnabled; });
                                        }
                                    }}
                                    style={{
                                        ...s.lobbyControlBtn,
                                        ...(lobbyVideoEnabled ? {} : s.lobbyControlBtnOff),
                                    }}
                                >
                                    {lobbyVideoEnabled ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Meeting info + join */}
                    <div style={s.lobbyRight}>
                        <div style={s.lobbyInfo}>
                            <img src="/vossle-logo.svg" alt="Vossle" style={{ width: 40, height: 40, marginBottom: '8px' }} />
                            <h2 style={s.lobbyTitle}>Ready to join?</h2>
                            <p style={s.lobbyMeetingName}>{session?.title || 'Vossle Meeting'}</p>
                            {session?.roomCode && (
                                <div style={s.lobbyCodeRow}>
                                    <span style={s.lobbyCode}>{session.roomCode}</span>
                                    <button onClick={copyRoomCode} style={s.lobbyCopyBtn}>
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={joinMeeting}
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%', marginTop: '20px', padding: '16px 28px', fontSize: '1rem' }}
                            >
                                Join Now
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                style={s.lobbyBackBtn}
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── WAITING FOR HOST ADMISSION ──
    if (waitingForAdmission) {
        return (
            <div style={s.fullCenter}>
                <div style={{ textAlign: 'center', maxWidth: 400 }}>
                    <img src="/vossle-logo.svg" alt="Vossle" style={{ width: 48, height: 48, marginBottom: 16 }} />
                    <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: 8 }}>Waiting for the host to let you in</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 24 }}>
                        The host has been notified of your request to join.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                        <div style={s.pulsingDot} /><div style={{ ...s.pulsingDot, animationDelay: '0.2s' }} /><div style={{ ...s.pulsingDot, animationDelay: '0.4s' }} />
                    </div>
                    <button
                        onClick={() => { setWaitingForAdmission(false); navigate('/dashboard'); }}
                        style={{ marginTop: 32, background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                        Cancel &amp; Go Back
                    </button>
                </div>
            </div>
        );
    }

    // ── ADMISSION DENIED ──
    if (admissionDenied) {
        return (
            <div style={s.fullCenter}>
                <div style={{ textAlign: 'center', maxWidth: 400 }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🚫</div>
                    <h2 style={{ color: '#ef4444', fontSize: '1.3rem', marginBottom: 8 }}>Request Denied</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 24 }}>
                        {error || 'The host denied your request to join this meeting.'}
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-primary"
                        style={{ padding: '12px 28px' }}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ── ACTIVE CALL ──
    return (
        <div style={s.roomContainer}>
            {/* Floating reactions */}
            <div style={s.reactionsOverlay}>
                {reactions.map(r => (
                    <div key={r.id} style={s.floatingReaction}>
                        <span style={{ fontSize: '2rem' }}>{r.emoji}</span>
                    </div>
                ))}
            </div>

            {/* Join Request Notifications (Host sees these) */}
            {joinRequests.length > 0 && (
                <div style={s.joinRequestOverlay}>
                    {joinRequests.map((req) => (
                        <div key={req.requestSocketId} style={s.joinRequestCard}>
                            <div style={s.joinRequestAvatar}>
                                {req.userName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                            </div>
                            <div style={s.joinRequestInfo}>
                                <span style={s.joinRequestName}>{req.userName}</span>
                                <span style={s.joinRequestLabel}>wants to join this meeting</span>
                            </div>
                            <div style={s.joinRequestActions}>
                                <button
                                    onClick={() => handleAdmit(req.requestSocketId)}
                                    style={s.admitBtn}
                                >
                                    Admit
                                </button>
                                <button
                                    onClick={() => handleReject(req.requestSocketId)}
                                    style={s.rejectBtn}
                                >
                                    Deny
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Top Bar */}
            <div style={s.topBar}>
                <div style={s.topBarLeft}>
                    <img src="/vossle-logo.svg" alt="Vossle" style={{ width: 26, height: 26 }} />
                    <div style={s.topBarDivider} />
                    {session && <span style={s.topBarTitle}>{session.title}</span>}
                </div>
                <div style={s.topBarCenter}>
                    {session?.roomCode && (
                        <button onClick={copyRoomCode} style={s.roomCodeBtn}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            <span>{copied ? 'Copied!' : session.roomCode}</span>
                        </button>
                    )}
                </div>
                <div style={s.topBarRight}>
                    {qualityMetrics?.connection?.roundTripTime != null && (
                        <div style={s.latencyPill}>
                            <div style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: connectionQuality === 'good' ? '#22c55e' : connectionQuality === 'fair' ? '#f59e0b' : '#ef4444',
                            }} />
                            <span>{Math.round(qualityMetrics.connection.roundTripTime * 1000)}ms</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main content */}
            <div style={s.mainArea}>
                {/* Video grid */}
                <div style={{
                    ...s.videoSection,
                    ...(sidePanel ? s.videoSectionWithPanel : {}),
                }}>
                    {/* Remote Video (main) */}
                    <div style={s.remoteVideoContainer}>
                        {remoteStream ? (
                            <VideoPlayer
                                videoRef={remoteVideoRef}
                                stream={remoteStream}
                                name={remoteUserName}
                                isLocal={false}
                                isVideoEnabled={true}
                                isAudioEnabled={true}
                                connectionQuality={connectionQuality}
                            />
                        ) : (
                            <div style={s.waitingState}>
                                <div style={s.waitingContent}>
                                    {status === 'connecting' ? (
                                        <>
                                            <div className="spinner spinner-lg" />
                                            <p style={s.waitingText}>Connecting to {remoteUserName || 'participant'}...</p>
                                        </>
                                    ) : (
                                        <>
                                            <div style={s.waitingPulse}>
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#5e5e73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                                    <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                                                </svg>
                                            </div>
                                            <h3 style={s.waitingTitle}>Waiting for others to join</h3>
                                            <p style={s.waitingSubtext}>
                                                Share the code: <span style={s.waitingCode}>{session?.roomCode}</span>
                                            </p>
                                            <button onClick={copyRoomCode} className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}>
                                                {copied ? 'Copied!' : 'Copy Invite Code'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Local Video (PiP) */}
                    {localStream && (
                        <div style={s.localPip}>
                            <VideoPlayer
                                videoRef={localVideoRef}
                                stream={localStream}
                                muted={true}
                                mirror={!isScreenSharing}
                                name={user?.name}
                                isLocal={true}
                                isVideoEnabled={isVideoEnabled}
                                isAudioEnabled={isAudioEnabled}
                            />
                        </div>
                    )}
                </div>

                {/* Side panel */}
                {sidePanel && (
                    <div style={s.sidePanelContainer}>
                        {chatOpen && (
                            <ChatPanel
                                messages={messages}
                                onSendMessage={handleSendMessage}
                                onClose={handleToggleChat}
                                currentUserId={user?.id}
                            />
                        )}
                        {participantsOpen && (
                            <ParticipantsPanel
                                participants={participants}
                                currentUserId={user?.id}
                                hostId={session?.hostId}
                                roomCode={session?.roomCode}
                                onClose={handleToggleParticipants}
                                onInvite={copyRoomCode}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Call Controls */}
            <CallControls
                isAudioEnabled={isAudioEnabled}
                isVideoEnabled={isVideoEnabled}
                isScreenSharing={isScreenSharing}
                isHandRaised={isHandRaised}
                connectionState={connectionState}
                participantCount={participants.length}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                onToggleScreenShare={toggleScreenShare}
                onEndCall={handleEndCall}
                onToggleChat={handleToggleChat}
                onToggleParticipants={handleToggleParticipants}
                onToggleHandRaise={handleToggleHandRaise}
                onReaction={handleReaction}
                hasUnreadChat={hasUnread}
                chatOpen={chatOpen}
                participantsOpen={participantsOpen}
                meetingDuration={meetingDuration}
            />
        </div>
    );
};

/* ── Styles ── */
const s = {
    fullCenter: {
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        padding: '24px',
    },
    errorCard: {
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '400px',
        padding: '40px',
        background: 'rgba(18,18,26,0.9)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.06)',
    },
    errorIconWrap: {
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'rgba(239, 68, 68, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorTitle: { fontSize: '1.2rem', fontWeight: 600, color: '#f0f0f5' },
    errorText: { color: '#9191a8', fontSize: '0.88rem', lineHeight: 1.5 },

    /* ── Lobby ── */
    lobbyPage: {
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        padding: '24px',
    },
    lobbyContainer: {
        display: 'flex',
        gap: '40px',
        maxWidth: '900px',
        width: '100%',
        alignItems: 'center',
    },
    lobbyLeft: { flex: 1 },
    lobbyPreview: {
        position: 'relative',
        width: '100%',
        aspectRatio: '4/3',
        borderRadius: '16px',
        overflow: 'hidden',
        background: '#16161f',
        border: '1px solid rgba(255,255,255,0.06)',
    },
    lobbyVideo: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'opacity 300ms',
    },
    lobbyAvatarWrap: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        background: 'linear-gradient(145deg, #16161f, #0d0d14)',
    },
    lobbyAvatarRing: {
        padding: '3px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    },
    lobbyAvatar: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: '#1a1a28',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        fontWeight: 700,
        color: '#f0f0f5',
    },
    lobbyCamOff: { color: '#5e5e73', fontSize: '0.82rem' },
    lobbyControls: {
        position: 'absolute',
        bottom: '14px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px',
    },
    lobbyControlBtn: {
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        color: '#f0f0f5',
        transition: 'all 150ms',
    },
    lobbyControlBtnOff: {
        background: '#ef4444',
        color: 'white',
    },
    lobbyRight: {
        width: '300px',
        flexShrink: 0,
    },
    lobbyInfo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
    },
    lobbyTitle: {
        fontSize: '1.5rem',
        fontWeight: 700,
        color: '#f0f0f5',
        marginBottom: '6px',
    },
    lobbyMeetingName: {
        fontSize: '0.88rem',
        color: '#9191a8',
        marginBottom: '16px',
    },
    lobbyCodeRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.06)',
    },
    lobbyCode: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.95rem',
        fontWeight: 600,
        color: '#818cf8',
        letterSpacing: '1.5px',
    },
    lobbyCopyBtn: {
        background: 'none',
        border: 'none',
        color: '#6366f1',
        fontSize: '0.78rem',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
    },
    lobbyBackBtn: {
        marginTop: '12px',
        background: 'none',
        border: 'none',
        color: '#5e5e73',
        fontSize: '0.82rem',
        cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
    },

    // Waiting animation dots
    pulsingDot: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#6366f1',
        animation: 'vossle-pulse 1s infinite ease-in-out',
    },

    /* ── Active call ── */
    roomContainer: {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0a0f',
        overflow: 'hidden',
    },
    topBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        background: 'rgba(10, 10, 15, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        zIndex: 10,
        minHeight: '48px',
    },
    topBarLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    topBarDivider: {
        width: '1px',
        height: '18px',
        background: 'rgba(255,255,255,0.08)',
    },
    topBarTitle: {
        fontSize: '0.82rem',
        color: '#9191a8',
        fontWeight: 500,
    },
    topBarCenter: {
        display: 'flex',
        alignItems: 'center',
    },
    roomCodeBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 12px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '8px',
        color: '#9191a8',
        fontSize: '0.75rem',
        fontFamily: "'JetBrains Mono', monospace",
        cursor: 'pointer',
        transition: 'all 150ms',
    },
    topBarRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    latencyPill: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '6px',
        fontSize: '0.7rem',
        fontFamily: "'JetBrains Mono', monospace",
        color: '#9191a8',
    },
    joinRequestOverlay: {
        position: 'fixed',
        top: 72,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 30,
    },
    joinRequestCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        background: 'rgba(15, 15, 25, 0.96)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 18px 45px rgba(0,0,0,0.55)',
        minWidth: '260px',
    },
    joinRequestAvatar: {
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.9rem',
        fontWeight: 600,
        color: '#f9fafb',
    },
    joinRequestInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    joinRequestName: {
        fontSize: '0.85rem',
        fontWeight: 600,
        color: '#e5e7eb',
    },
    joinRequestLabel: {
        fontSize: '0.75rem',
        color: '#9ca3af',
    },
    joinRequestActions: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    },
    admitBtn: {
        padding: '6px 10px',
        borderRadius: 999,
        border: 'none',
        background: '#22c55e',
        color: '#022c22',
        fontSize: '0.75rem',
        fontWeight: 600,
        cursor: 'pointer',
    },
    rejectBtn: {
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid rgba(248,113,113,0.5)',
        background: 'transparent',
        color: '#fecaca',
        fontSize: '0.75rem',
        fontWeight: 500,
        cursor: 'pointer',
    },
    mainArea: {
        flex: 1,
        display: 'flex',
        padding: '8px',
        gap: '8px',
        overflow: 'hidden',
    },
    videoSection: {
        flex: 1,
        position: 'relative',
        transition: 'all 300ms ease',
    },
    videoSectionWithPanel: {},
    remoteVideoContainer: {
        width: '100%',
        height: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
    },
    localPip: {
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        width: '220px',
        height: '165px',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        zIndex: 5,
        border: '2px solid rgba(255,255,255,0.08)',
        transition: 'all 300ms ease',
    },
    sidePanelContainer: {
        width: '340px',
        height: '100%',
        flexShrink: 0,
        animation: 'slideInRight 200ms ease',
    },
    waitingState: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #16161f, #0d0d14)',
        borderRadius: '12px',
    },
    waitingContent: {
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
    },
    waitingPulse: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '8px',
    },
    waitingTitle: { color: '#f0f0f5', fontSize: '1.1rem', fontWeight: 600 },
    waitingText: { color: '#9191a8', fontSize: '0.9rem' },
    waitingSubtext: { color: '#5e5e73', fontSize: '0.82rem' },
    waitingCode: {
        fontFamily: "'JetBrains Mono', monospace",
        color: '#818cf8',
        fontWeight: 600,
        letterSpacing: '1px',
    },
    reactionsOverlay: {
        position: 'fixed',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        zIndex: 100,
        pointerEvents: 'none',
    },
    floatingReaction: {
        animation: 'float 3s ease-out forwards',
        opacity: 0.9,
    },
};

export default Room;
