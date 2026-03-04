/**
 * Vossle — useWebRTC Hook v3
 * Core WebRTC peer connection management with signaling integration.
 * Multi-peer support with ref-based stream access to avoid stale closures.
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

    // ── Refs (always current, never stale in closures) ──
    const localStreamRef = useRef(null);
    const peerConnections = useRef(new Map());
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const screenStream = useRef(null);
    const originalVideoTrack = useRef(null);
    const metricsInterval = useRef(null);
    const remotePeerRef = useRef(null);

    // Keep ref in sync with React state
    useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

    /**
     * Initialize local media stream
     */
    const initializeMedia = useCallback(async (videoConstraints = true) => {
        try {
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                },
                video: videoConstraints === true
                    ? { width: { ideal: 1280, max: 1920 }, height: { ideal: 720, max: 1080 }, frameRate: { ideal: 30, max: 60 }, facingMode: 'user' }
                    : videoConstraints,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Update both state AND ref immediately so it's never stale
            setLocalStream(stream);
            localStreamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            console.log('[Vossle WebRTC] Media initialized — tracks:', stream.getTracks().map(t => t.kind).join(', '));
            return stream;
        } catch (error) {
            console.error('[Vossle WebRTC] Media access error:', error);
            throw error;
        }
    }, []);

    /**
     * Helper: get ICE server config (with fallback)
     */
    const getIceConfig = useCallback(async () => {
        try {
            return await api.getIceServers();
        } catch {
            return {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                ],
            };
        }
    }, []);

    /**
     * Create and configure a peer connection for a specific remote socket.
     * Uses localStreamRef.current so it's NEVER stale.
     */
    const createPeerConnection = useCallback(async (remoteSocketId) => {
        // Close existing PC for this remote if any
        const existing = peerConnections.current.get(remoteSocketId);
        if (existing) {
            try { existing.close(); } catch { /* ignore */ }
            peerConnections.current.delete(remoteSocketId);
        }

        const iceConfig = await getIceConfig();

        const pc = new RTCPeerConnection({
            iceServers: iceConfig.iceServers,
            iceTransportPolicy: iceConfig.iceTransportPolicy || 'all',
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
        });

        // Add local tracks from the ref (always current)
        const stream = localStreamRef.current;
        if (stream) {
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });
            console.log('[Vossle WebRTC] Added', stream.getTracks().length, 'local tracks to PC for', remoteSocketId);
        } else {
            console.warn('[Vossle WebRTC] No local stream when creating PC for', remoteSocketId);
        }

        // Handle remote tracks
        pc.ontrack = (event) => {
            console.log('[Vossle WebRTC] Remote track from', remoteSocketId, event.track.kind);
            const [remoteStreamObj] = event.streams;
            setRemoteStream(remoteStreamObj);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStreamObj;
            }
        };

        // ICE candidates → signaling
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketService.emit('webrtc:ice-candidate', {
                    candidate: event.candidate,
                    targetSocketId: remoteSocketId,
                });
            }
        };

        // Connection state tracking
        pc.onconnectionstatechange = () => {
            console.log('[Vossle WebRTC] Connection state for', remoteSocketId, '→', pc.connectionState);
            setConnectionState(pc.connectionState);
        };

        pc.oniceconnectionstatechange = () => {
            console.log('[Vossle WebRTC] ICE state for', remoteSocketId, '→', pc.iceConnectionState);
            if (pc.iceConnectionState === 'failed') {
                try { pc.restartIce(); } catch (e) { console.warn('restartIce failed', e); }
            }
        };

        pc.onsignalingstatechange = () => {
            console.log('[Vossle WebRTC] Signaling state for', remoteSocketId, '→', pc.signalingState);
        };

        peerConnections.current.set(remoteSocketId, pc);
        console.log('[Vossle WebRTC] Created PC for', remoteSocketId, '| total PCs:', peerConnections.current.size);
        return pc;
    }, [getIceConfig]);

    /**
     * Start call — create SDP offer and send via signaling
     */
    const startCall = useCallback(async (targetSocketId) => {
        console.log('[Vossle WebRTC] startCall →', targetSocketId);
        const pc = await createPeerConnection(targetSocketId);
        remotePeerRef.current = targetSocketId;

        const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);

        socketService.emit('webrtc:offer', {
            offer: pc.localDescription,
            targetSocketId,
        });
        console.log('[Vossle WebRTC] Sent offer to', targetSocketId);
    }, [createPeerConnection]);

    /**
     * Handle incoming SDP offer — create answer
     */
    const handleOffer = useCallback(async (offer, senderSocketId) => {
        console.log('[Vossle WebRTC] handleOffer from', senderSocketId);
        const pc = await createPeerConnection(senderSocketId);
        remotePeerRef.current = senderSocketId;

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketService.emit('webrtc:answer', {
            answer: pc.localDescription,
            targetSocketId: senderSocketId,
        });
        console.log('[Vossle WebRTC] Sent answer to', senderSocketId);
    }, [createPeerConnection]);

    /**
     * Handle incoming SDP answer
     */
    const handleAnswer = useCallback(async (answer, senderSocketId) => {
        console.log('[Vossle WebRTC] handleAnswer from', senderSocketId);
        const pc = peerConnections.current.get(senderSocketId);
        if (!pc) {
            console.warn('[Vossle WebRTC] No PC found for answer from', senderSocketId);
            return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }, []);

    /**
     * Handle incoming ICE candidate
     */
    const handleIceCandidate = useCallback(async (candidate, senderSocketId) => {
        const pc = peerConnections.current.get(senderSocketId);
        if (!pc) {
            console.warn('[Vossle WebRTC] No PC for ICE from', senderSocketId);
            return;
        }
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('[Vossle WebRTC] ICE candidate error:', error);
        }
    }, []);

    /**
     * Toggle audio
     */
    const toggleAudio = useCallback(() => {
        const stream = localStreamRef.current;
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
                socketService.emit('media:toggle-audio', { enabled: audioTrack.enabled });
            }
        }
    }, []);

    /**
     * Toggle video
     */
    const toggleVideo = useCallback(() => {
        const stream = localStreamRef.current;
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
                socketService.emit('media:toggle-video', { enabled: videoTrack.enabled });
            }
        }
    }, []);

    /**
     * Toggle screen sharing
     */
    const toggleScreenShare = useCallback(async () => {
        // For multi-peer: replace track on all peer connections
        const pcs = Array.from(peerConnections.current.values());

        if (isScreenSharing) {
            // Stop screen sharing — restore camera
            if (screenStream.current) {
                screenStream.current.getTracks().forEach((t) => t.stop());
                screenStream.current = null;
            }
            if (originalVideoTrack.current) {
                for (const p of pcs) {
                    const sender = p.getSenders().find((s) => s.track?.kind === 'video');
                    if (sender) {
                        await sender.replaceTrack(originalVideoTrack.current);
                    }
                }
                originalVideoTrack.current = null;
            }
            setIsScreenSharing(false);
            socketService.emit('media:screen-share', { sharing: false });
        } else {
            // Start screen sharing
            try {
                const display = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: true,
                });
                screenStream.current = display;

                const screenVideoTrack = display.getVideoTracks()[0];
                // Replace sender track on every peer connection
                for (const p of pcs) {
                    const sender = p.getSenders().find((s) => s.track?.kind === 'video');
                    if (sender && !originalVideoTrack.current) {
                        originalVideoTrack.current = sender.track;
                    }
                    if (sender) {
                        await sender.replaceTrack(screenVideoTrack);
                    }
                }

                // Auto-stop when user clicks "Stop sharing" in browser UI
                screenVideoTrack.onended = () => {
                    toggleScreenShare();
                };

                setIsScreenSharing(true);
                socketService.emit('media:screen-share', { sharing: true });
            } catch (error) {
                console.error('[Vossle WebRTC] Screen share error:', error);
            }
        }
    }, [isScreenSharing]);

    /**
     * Collect quality metrics from any active PC
     */
    const collectMetrics = useCallback(async () => {
        let activePc = null;
        for (const pc of peerConnections.current.values()) {
            if (pc.connectionState === 'connected') { activePc = pc; break; }
        }
        if (!activePc) return;

        try {
            const stats = await activePc.getStats();
            let metrics = {};

            stats.forEach((report) => {
                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                    metrics.video = {
                        packetsReceived: report.packetsReceived,
                        packetsLost: report.packetsLost,
                        bytesReceived: report.bytesReceived,
                        framesDecoded: report.framesDecoded,
                        framesDropped: report.framesDropped,
                        jitter: report.jitter,
                    };
                }
                if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                    metrics.audio = {
                        packetsReceived: report.packetsReceived,
                        packetsLost: report.packetsLost,
                        jitter: report.jitter,
                    };
                }
                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    metrics.connection = {
                        roundTripTime: report.currentRoundTripTime,
                        availableOutgoingBitrate: report.availableOutgoingBitrate,
                    };
                }
            });

            setQualityMetrics(metrics);
            socketService.emit('quality:report', metrics);
        } catch { /* silent */ }
    }, []);

    /**
     * End call and cleanup ALL peer connections
     */
    const endCall = useCallback(() => {
        if (metricsInterval.current) {
            clearInterval(metricsInterval.current);
            metricsInterval.current = null;
        }

        if (screenStream.current) {
            screenStream.current.getTracks().forEach((t) => t.stop());
            screenStream.current = null;
        }

        // Close every peer connection
        for (const [id, pc] of peerConnections.current) {
            try { pc.close(); } catch { /* ignore */ }
        }
        peerConnections.current.clear();

        // Stop local media
        const stream = localStreamRef.current;
        if (stream) {
            stream.getTracks().forEach((t) => t.stop());
        }

        setLocalStream(null);
        localStreamRef.current = null;
        setRemoteStream(null);
        setConnectionState('closed');
        setIsScreenSharing(false);
        originalVideoTrack.current = null;
    }, []);

    // Start metrics collection when connected
    useEffect(() => {
        if (connectionState === 'connected') {
            metricsInterval.current = setInterval(collectMetrics, 3000);
        }
        return () => {
            if (metricsInterval.current) {
                clearInterval(metricsInterval.current);
            }
        };
    }, [connectionState, collectMetrics]);

    return {
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
    };
};

export default useWebRTC;
