/**
 * Vossle — useWebRTC Hook
 * Core WebRTC peer connection management with signaling integration.
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
    const [remotePeer, setRemotePeer] = useState(null);
    const [qualityMetrics, setQualityMetrics] = useState(null);

    // Support multiple peer connections (one per remote socket id)
    const peerConnections = useRef(new Map()); // socketId -> RTCPeerConnection
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const screenStream = useRef(null);
    const originalVideoTrack = useRef(null);
    const metricsInterval = useRef(null);
    const lastRemotePeer = useRef(null);

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
                video: videoConstraints === true ? {
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, max: 60 },
                    facingMode: 'user',
                } : videoConstraints,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            return stream;
        } catch (error) {
            console.error('[Vossle WebRTC] Media access error:', error);
            throw error;
        }
    }, []);

    /**
     * Create and configure peer connection
     */
    const createPeerConnection = useCallback(async (stream, remoteSocketId) => {
        try {
            // Fetch ICE servers from backend
            let iceConfig;
            try {
                iceConfig = await api.getIceServers();
            } catch {
                iceConfig = {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                    ],
                };
            }

            const pc = new RTCPeerConnection({
                iceServers: iceConfig.iceServers,
                iceTransportPolicy: iceConfig.iceTransportPolicy || 'all',
                bundlePolicy: 'max-bundle',
                rtcpMuxPolicy: 'require',
            });

            // Add local tracks to connection
            if (stream) {
                stream.getTracks().forEach((track) => {
                    pc.addTrack(track, stream);
                });
            }

            // Handle remote tracks
            pc.ontrack = (event) => {
                console.log('[Vossle WebRTC] Remote track received from', remoteSocketId, event.track.kind);
                const [remoteStreamObj] = event.streams;
                // remember last remote stream for main view
                setRemoteStream(remoteStreamObj);
                lastRemotePeer.current = remoteSocketId;
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStreamObj;
                }
            };

            // ICE candidate handling — trickle ICE
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
                setConnectionState(pc.connectionState);
                console.log('[Vossle WebRTC] Connection state:', pc.connectionState);
            };

            pc.oniceconnectionstatechange = () => {
                console.log('[Vossle WebRTC] ICE state:', pc.iceConnectionState);
                if (pc.iceConnectionState === 'failed') {
                    pc.restartIce();
                }
            };

            // store connection for this remote
            if (remoteSocketId) peerConnections.current.set(remoteSocketId, pc);
            return pc;
        } catch (error) {
            console.error('[Vossle WebRTC] Peer connection error:', error);
            throw error;
        }
    }, []);

    const remotePeerRef = useRef(null);

    /**
     * Start call — create offer and send via signaling
     */
    const startCall = useCallback(async (targetSocketId) => {
        // create or reuse peer connection for target
        let pc = peerConnections.current.get(targetSocketId);
        if (!pc) {
            pc = await createPeerConnection(localStream, targetSocketId);
        }

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
    }, [createPeerConnection, localStream]);

    /**
     * Handle incoming offer — create answer
     */
    const handleOffer = useCallback(async (offer, senderSocketId) => {
        // ensure peer connection for sender
        let pc = peerConnections.current.get(senderSocketId);
        if (!pc) {
            pc = await createPeerConnection(localStream, senderSocketId);
        }

        remotePeerRef.current = senderSocketId;

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketService.emit('webrtc:answer', {
            answer: pc.localDescription,
            targetSocketId: senderSocketId,
        });
    }, [createPeerConnection, localStream]);

    /**
     * Handle incoming answer
     */
    const handleAnswer = useCallback(async (answer, senderSocketId) => {
        const pc = peerConnections.current.get(senderSocketId);
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }, []);

    /**
     * Handle incoming ICE candidate
     */
    const handleIceCandidate = useCallback(async (candidate, senderSocketId) => {
        const pc = peerConnections.current.get(senderSocketId);
        if (!pc) return;
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
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
                socketService.emit('media:toggle-audio', { enabled: audioTrack.enabled });
            }
        }
    }, [localStream]);

    /**
     * Toggle video
     */
    const toggleVideo = useCallback(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
                socketService.emit('media:toggle-video', { enabled: videoTrack.enabled });
            }
        }
    }, [localStream]);

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
     * Collect WebRTC quality metrics
     */
    const collectMetrics = useCallback(async () => {
        const pc = peerConnection.current;
        if (!pc) return;

        try {
            const stats = await pc.getStats();
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
        } catch (error) {
            // Silently fail on metrics collection
        }
    }, []);

    /**
     * End call and cleanup
     */
    const endCall = useCallback(() => {
        // Stop metrics collection
        if (metricsInterval.current) {
            clearInterval(metricsInterval.current);
            metricsInterval.current = null;
        }

        // Stop screen sharing
        if (screenStream.current) {
            screenStream.current.getTracks().forEach((t) => t.stop());
            screenStream.current = null;
        }

        // Close peer connection
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

        // Stop local media
        if (localStream) {
            localStream.getTracks().forEach((t) => t.stop());
        }

        setLocalStream(null);
        setRemoteStream(null);
        setConnectionState('closed');
        setIsScreenSharing(false);
        setRemotePeer(null);
    }, [localStream]);

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
        // State
        localStream,
        remoteStream,
        connectionState,
        isAudioEnabled,
        isVideoEnabled,
        isScreenSharing,
        remotePeer,
        qualityMetrics,

        // Refs
        localVideoRef,
        remoteVideoRef,

        // Actions
        initializeMedia,
        createPeerConnection,
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
