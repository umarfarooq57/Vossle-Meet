/**
 * Vossle — useWebRTC Hook v5
 * Implements "Perfect Negotiation" pattern to eliminate signaling glare.
 * Handles asymmetrical role (polite vs impolite) for robust connections.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import socketService from '../services/socket.service';
import api from '../services/api.service';

const useWebRTC = (roomId) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [connectionState, setConnectionState] = useState('new');
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [qualityMetrics, setQualityMetrics] = useState(null);

    // ── Refs ──
    const localStreamRef = useRef(null);
    const peerConnections = useRef(new Map());
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const screenStream = useRef(null);
    const originalVideoTrack = useRef(null);
    const metricsInterval = useRef(null);

    // Perfect Negotiation State
    const makingOffer = useRef(false);
    const ignoreOffer = useRef(false);

    // ICE candidate buffering: candidates that arrive before remote description is set
    const iceCandidateBuffer = useRef(new Map()); // Map<socketId, RTCIceCandidate[]>
    const remoteDescReady = useRef(new Set());    // Set<socketId> — remote desc has resolved

    // Sync ref
    useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

    /**
     * Initialize local media
     */
    const initializeMedia = useCallback(async (videoConstraints = true) => {
        try {
            const constraints = {
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                video: videoConstraints === true
                    ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, facingMode: 'user' }
                    : videoConstraints,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);
            localStreamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            console.log('[Vossle WebRTC] Media initialized:', stream.getTracks().map(t => `${t.kind}:${t.label}`));
            return stream;
        } catch (error) {
            console.error('[Vossle WebRTC] Media error:', error);
            // Fallback: try audio-only if video fails
            if (videoConstraints) {
                try {
                    const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    setLocalStream(audioOnly);
                    localStreamRef.current = audioOnly;
                    setIsVideoEnabled(false);
                    console.warn('[Vossle WebRTC] Fallback to audio-only');
                    return audioOnly;
                } catch (audioErr) {
                    console.error('[Vossle WebRTC] Audio-only fallback also failed:', audioErr);
                }
            }
            throw error;
        }
    }, []);

    /**
     * Get ICE configuration from server, with robust fallback
     */
    const getIceConfig = useCallback(async () => {
        try {
            const data = await api.getIceServers();
            // API returns { iceServers: [...], iceTransportPolicy: 'all' }
            if (data && data.iceServers && data.iceServers.length > 0) {
                return {
                    iceServers: data.iceServers,
                    iceTransportPolicy: data.iceTransportPolicy || 'all',
                };
            }
        } catch (err) {
            console.warn('[Vossle WebRTC] Failed to fetch ICE config from server, using fallback:', err.message);
        }
        // Fallback ICE config with STUN + free TURN
        return {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                {
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credential: 'openrelayproject',
                },
                {
                    urls: 'turn:openrelay.metered.ca:443',
                    username: 'openrelayproject',
                    credential: 'openrelayproject',
                },
                {
                    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                    username: 'openrelayproject',
                    credential: 'openrelayproject',
                },
            ],
            iceTransportPolicy: 'all',
        };
    }, []);

    /**
     * Create Peer Connection with Perfect Negotiation logic
     */
    const createPeerConnection = useCallback(async (remoteSocketId, isPolite) => {
        const existing = peerConnections.current.get(remoteSocketId);
        if (existing && existing.connectionState !== 'closed' && existing.connectionState !== 'failed') {
            return existing;
        }

        // Close any stale connection
        if (existing) {
            existing.close();
            peerConnections.current.delete(remoteSocketId);
        }

        const iceConfig = await getIceConfig();
        console.log('[Vossle WebRTC] Creating PC with config:', iceConfig.iceServers.length, 'servers, polite:', isPolite);
        const pc = new RTCPeerConnection(iceConfig);

        // Add local tracks to the connection
        const stream = localStreamRef.current;
        if (stream) {
            stream.getTracks().forEach(track => {
                console.log('[Vossle WebRTC] Adding track:', track.kind, track.label);
                pc.addTrack(track, stream);
            });
        } else {
            console.warn('[Vossle WebRTC] No local stream when creating PC!');
        }

        // Handle remote tracks
        pc.ontrack = ({ streams: [remoteStreamObj], track }) => {
            console.log('[Vossle WebRTC] Remote track received:', track.kind, track.label);
            setRemoteStream(remoteStreamObj);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStreamObj;
            }

            // Ensure the remote video plays
            track.onunmute = () => {
                console.log('[Vossle WebRTC] Remote track unmuted:', track.kind);
                if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStreamObj) {
                    remoteVideoRef.current.srcObject = remoteStreamObj;
                }
            };
        };

        // ICE candidates
        pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
                socketService.emit('webrtc:ice-candidate', { candidate, targetSocketId: remoteSocketId });
            }
        };

        pc.onicecandidateerror = (event) => {
            // Only warn on non-trivial errors
            if (event.errorCode !== 701) {
                console.warn('[Vossle WebRTC] ICE candidate error:', event.errorCode, event.errorText);
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`[Vossle WebRTC] ICE state (${remoteSocketId}): ${pc.iceConnectionState}`);
            if (pc.iceConnectionState === 'failed') {
                // Attempt ICE restart
                console.warn('[Vossle WebRTC] ICE failed, attempting restart...');
                pc.restartIce();
            }
        };

        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            console.log(`[Vossle WebRTC] Connection state (${remoteSocketId}): ${state}`);
            setConnectionState(state);
        };

        // ── Perfect Negotiation: NegotiationNeeded ──
        pc.onnegotiationneeded = async () => {
            try {
                makingOffer.current = true;
                console.log('[Vossle WebRTC] Negotiation needed, creating offer...');
                await pc.setLocalDescription();
                socketService.emit('webrtc:offer', {
                    offer: pc.localDescription,
                    targetSocketId: remoteSocketId,
                });
                console.log('[Vossle WebRTC] Offer sent to', remoteSocketId);
            } catch (err) {
                console.error('[Vossle WebRTC] Negotiation error:', err);
            } finally {
                makingOffer.current = false;
            }
        };

        peerConnections.current.set(remoteSocketId, pc);

        // Start quality metrics collection
        startQualityMetrics(pc);

        return pc;
    }, [getIceConfig]);

    /**
     * Collect quality metrics periodically
     */
    const startQualityMetrics = (pc) => {
        if (metricsInterval.current) clearInterval(metricsInterval.current);
        metricsInterval.current = setInterval(async () => {
            try {
                const stats = await pc.getStats();
                let roundTripTime = null;
                stats.forEach(report => {
                    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                        roundTripTime = report.currentRoundTripTime;
                    }
                });
                if (roundTripTime !== null) {
                    setQualityMetrics({ connection: { roundTripTime } });
                }
            } catch { }
        }, 5000);
    };

    /**
     * Flush any ICE candidates that were buffered while waiting for the remote
     * description to be set. Call this immediately after setRemoteDescription resolves.
     */
    const flushIceCandidates = useCallback(async (pc, senderSocketId) => {
        remoteDescReady.current.add(senderSocketId);
        const buffered = iceCandidateBuffer.current.get(senderSocketId) || [];
        iceCandidateBuffer.current.delete(senderSocketId);
        for (const c of buffered) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {
                console.warn('[Vossle WebRTC] Buffered ICE candidate error:', e.message);
            }
        }
    }, []);

    /**
     * Handle SDP Offer with Collision/Glare Management
     */
    const handleOffer = useCallback(async (offer, senderSocketId, isPolite) => {
        let pc = peerConnections.current.get(senderSocketId);
        if (!pc || pc.connectionState === 'closed' || pc.connectionState === 'failed') {
            pc = await createPeerConnection(senderSocketId, isPolite);
        }

        try {
            const offerCollision = (makingOffer.current || pc.signalingState !== 'stable');
            ignoreOffer.current = !isPolite && offerCollision;

            if (ignoreOffer.current) {
                console.warn('[Vossle WebRTC] Glare detected: Ignoring offer (impolite role)');
                return;
            }

            console.log('[Vossle WebRTC] Processing offer from', senderSocketId, 'polite:', isPolite);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            // Remote description is now set — flush any buffered ICE candidates
            await flushIceCandidates(pc, senderSocketId);

            if (offer.type === 'offer') {
                await pc.setLocalDescription();
                socketService.emit('webrtc:answer', {
                    answer: pc.localDescription,
                    targetSocketId: senderSocketId,
                });
                console.log('[Vossle WebRTC] Answer sent to', senderSocketId);
            }
        } catch (err) {
            console.error('[Vossle WebRTC] Offer handling error:', err);
        }
    }, [createPeerConnection, flushIceCandidates]);

    /**
     * Handle SDP Answer
     */
    const handleAnswer = useCallback(async (answer, senderSocketId) => {
        const pc = peerConnections.current.get(senderSocketId);
        if (!pc) {
            console.warn('[Vossle WebRTC] No PC for answer from', senderSocketId);
            return;
        }
        try {
            console.log('[Vossle WebRTC] Processing answer from', senderSocketId);
            await pc.setRemoteDescription(new RTCSessionDescription(answer));

            // Remote description is now set — flush any buffered ICE candidates
            await flushIceCandidates(pc, senderSocketId);
        } catch (err) {
            console.error('[Vossle WebRTC] Answer handling error:', err);
        }
    }, [flushIceCandidates]);

    /**
     * Handle ICE Candidate
     * Buffers candidates that arrive before the remote description is set,
     * to avoid "addIceCandidate called in wrong state" failures.
     */
    const handleIceCandidate = useCallback(async (candidate, senderSocketId) => {
        const pc = peerConnections.current.get(senderSocketId);

        // Buffer the candidate if the PC doesn't exist yet or remote description
        // hasn't been set (setRemoteDescription is still pending or hasn't been called).
        if (!pc || !remoteDescReady.current.has(senderSocketId)) {
            if (!iceCandidateBuffer.current.has(senderSocketId)) {
                iceCandidateBuffer.current.set(senderSocketId, []);
            }
            iceCandidateBuffer.current.get(senderSocketId).push(candidate);
            return;
        }

        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.error('[Vossle WebRTC] ICE candidate error:', err);
        }
    }, []);

    const toggleAudio = useCallback(() => {
        const stream = localStreamRef.current;
        if (stream) {
            const track = stream.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsAudioEnabled(track.enabled);
                socketService.emit('media:toggle-audio', { enabled: track.enabled });
            }
        }
    }, []);

    const toggleVideo = useCallback(() => {
        const stream = localStreamRef.current;
        if (stream) {
            const track = stream.getVideoTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsVideoEnabled(track.enabled);
                socketService.emit('media:toggle-video', { enabled: track.enabled });
            }
        }
    }, []);

    const toggleScreenShare = useCallback(async () => {
        const pcs = Array.from(peerConnections.current.values());
        if (isScreenSharing) {
            if (screenStream.current) {
                screenStream.current.getTracks().forEach(t => t.stop());
                screenStream.current = null;
            }
            if (originalVideoTrack.current) {
                for (const pc of pcs) {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) await sender.replaceTrack(originalVideoTrack.current);
                }
                originalVideoTrack.current = null;
            }
            setIsScreenSharing(false);
            socketService.emit('media:screen-share', { sharing: false });
        } else {
            try {
                const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                screenStream.current = display;
                const screenTrack = display.getVideoTracks()[0];
                for (const pc of pcs) {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender && !originalVideoTrack.current) originalVideoTrack.current = sender.track;
                    if (sender) await sender.replaceTrack(screenTrack);
                }
                screenTrack.onended = () => toggleScreenShare();
                setIsScreenSharing(true);
                socketService.emit('media:screen-share', { sharing: true });
            } catch (err) {
                console.error('[Vossle WebRTC] Screen share error:', err);
            }
        }
    }, [isScreenSharing]);

    const endCall = useCallback(() => {
        if (metricsInterval.current) clearInterval(metricsInterval.current);
        if (screenStream.current) screenStream.current.getTracks().forEach(t => t.stop());
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();
        iceCandidateBuffer.current.clear();
        remoteDescReady.current.clear();
        if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
        setLocalStream(null);
        setRemoteStream(null);
        setConnectionState('closed');
        setIsScreenSharing(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (metricsInterval.current) clearInterval(metricsInterval.current);
            peerConnections.current.forEach(pc => pc.close());
            peerConnections.current.clear();
            iceCandidateBuffer.current.clear();
            remoteDescReady.current.clear();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    return {
        localStream, remoteStream, connectionState, isAudioEnabled, isVideoEnabled, isScreenSharing,
        localVideoRef, remoteVideoRef, qualityMetrics,
        initializeMedia, createPeerConnection, handleOffer, handleAnswer, handleIceCandidate,
        toggleAudio, toggleVideo, toggleScreenShare, endCall
    };
};

export default useWebRTC;
