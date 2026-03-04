/**
 * Vossle — useWebRTC Hook v4
 * Implements "Perfect Negotiation" pattern to eliminate signaling glare.
 * Handles asymmetrical role (polite vs impolite) for robust connections.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import socketService from '../services/socket.service';
import api from '../services/api.service';

const useWebRTC = (roomId, isPoliteInitial = false) => {
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
    const isSettingRemoteAnswerPending = useRef(false);

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

            console.log('[Vossle WebRTC] Media initialized');
            return stream;
        } catch (error) {
            console.error('[Vossle WebRTC] Media error:', error);
            throw error;
        }
    }, []);

    const getIceConfig = useCallback(async () => {
        try {
            return await api.getIceServers();
        } catch {
            return { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
        }
    }, []);

    /**
     * Create Peer Connection with Perfect Negotiation logic
     */
    const createPeerConnection = useCallback(async (remoteSocketId, isPolite) => {
        const existing = peerConnections.current.get(remoteSocketId);
        if (existing) return existing;

        const iceConfig = await getIceConfig();
        const pc = new RTCPeerConnection(iceConfig);

        // Track management
        const stream = localStreamRef.current;
        if (stream) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }

        pc.ontrack = ({ streams: [remoteStreamObj] }) => {
            setRemoteStream(remoteStreamObj);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStreamObj;
            }
        };

        pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
                socketService.emit('webrtc:ice-candidate', { candidate, targetSocketId: remoteSocketId });
            }
        };

        pc.onconnectionstatechange = () => {
            setConnectionState(pc.connectionState);
            console.log(`[WebRTC] Connection (${remoteSocketId}): ${pc.connectionState}`);
        };

        // ── Perfect Negotiation: NegotiationNeeded ──
        pc.onnegotiationneeded = async () => {
            try {
                makingOffer.current = true;
                await pc.setLocalDescription();
                socketService.emit('webrtc:offer', {
                    offer: pc.localDescription,
                    targetSocketId: remoteSocketId,
                });
            } catch (err) {
                console.error('[WebRTC] Negotiation error:', err);
            } finally {
                makingOffer.current = false;
            }
        };

        peerConnections.current.set(remoteSocketId, pc);
        return pc;
    }, [getIceConfig]);

    /**
     * Handle SDP Offer with Collision/Glare Management
     */
    const handleOffer = useCallback(async (offer, senderSocketId, isPolite) => {
        const pc = await createPeerConnection(senderSocketId, isPolite);

        try {
            const offerCollision = (makingOffer.current || pc.signalingState !== 'stable');
            ignoreOffer.current = !isPolite && offerCollision;

            if (ignoreOffer.current) {
                console.warn('[WebRTC] Glare detected: Ignoring offer (impolite role)');
                return;
            }

            isSettingRemoteAnswerPending.current = false;
            await pc.setRemoteDescription(offer);

            if (offer.type === 'offer') {
                await pc.setLocalDescription();
                socketService.emit('webrtc:answer', {
                    answer: pc.localDescription,
                    targetSocketId: senderSocketId,
                });
            }
        } catch (err) {
            console.error('[WebRTC] Offer handling error:', err);
        }
    }, [createPeerConnection]);

    /**
     * Handle SDP Answer
     */
    const handleAnswer = useCallback(async (answer, senderSocketId) => {
        const pc = peerConnections.current.get(senderSocketId);
        if (!pc) return;
        try {
            await pc.setRemoteDescription(answer);
        } catch (err) {
            console.error('[WebRTC] Answer handling error:', err);
        }
    }, []);

    /**
     * Handle ICE Candidate
     */
    const handleIceCandidate = useCallback(async (candidate, senderSocketId) => {
        const pc = peerConnections.current.get(senderSocketId);
        if (!pc) return;
        try {
            await pc.addIceCandidate(candidate);
        } catch (err) {
            if (!ignoreOffer.current) {
                console.error('[WebRTC] ICE error:', err);
            }
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
                console.error('[WebRTC] Screen share error:', err);
            }
        }
    }, [isScreenSharing]);

    const endCall = useCallback(() => {
        if (metricsInterval.current) clearInterval(metricsInterval.current);
        if (screenStream.current) screenStream.current.getTracks().forEach(t => t.stop());
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();
        if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
        setLocalStream(null);
        setRemoteStream(null);
        setConnectionState('closed');
        setIsScreenSharing(false);
    }, []);

    return {
        localStream, remoteStream, connectionState, isAudioEnabled, isVideoEnabled, isScreenSharing,
        localVideoRef, remoteVideoRef, qualityMetrics,
        initializeMedia, createPeerConnection, handleOffer, handleAnswer, handleIceCandidate,
        toggleAudio, toggleVideo, toggleScreenShare, endCall
    };
};

export default useWebRTC;
