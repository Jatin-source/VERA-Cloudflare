import { useState, useEffect, useRef, useCallback } from 'react';
import { signalingService } from '../services/signaling';
import { webrtcManager } from '../services/webrtc';
import { remoteAudioTap } from '../services/audioTap';
import { downsampleTo16k, audioChunkAccumulator, type AudioChunk } from '../services/audioConverter';
import { veraPipeline, type VeraTelemetry } from '../services/veraPipeline';
import type { CallState, SignalingMessage } from '../types/voip';

export function useVoIPSignaling() {
  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem('vera_voip_user') || 'User_A';
  });
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [callState, setCallState] = useState<CallState>('IDLE');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [incomingCallData, setIncomingCallData] = useState<{ caller_id: string; call_id: string } | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [webrtcState, setWebrtcState] = useState<RTCPeerConnectionState>('closed');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioTapActive, setIsAudioTapActive] = useState<boolean>(false);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState<number>(0);
  const [chunksProcessedCount, setChunksProcessedCount] = useState<number>(0);
  const [lastChunk, setLastChunk] = useState<AudioChunk | null>(null);
  const [veraSessionId, setVeraSessionId] = useState<string | null>(null);
  const [veraTelemetry, setVeraTelemetry] = useState<VeraTelemetry | null>(null);
  const [isAiConnected, setIsAiConnected] = useState<boolean>(false);
  const [fullTranscript, setFullTranscript] = useState<string>('');
  const [detectedSignals, setDetectedSignals] = useState<Array<any>>([]);

  const timerRef = useRef<any>(null);

  // Switch identity
  const switchUser = useCallback((newUser: string) => {
    const clean = newUser.trim();
    if (!clean) return;
    localStorage.setItem('vera_voip_user', clean);
    setCurrentUser(clean);
  }, []);

  // WebRTC remote stream & connection listeners
  useEffect(() => {
    const unsubStream = webrtcManager.onRemoteStream((stream) => {
      setRemoteStream(stream);
    });
    const unsubConn = webrtcManager.onConnectionState((state) => {
      setWebrtcState(state);
    });
    return () => {
      unsubStream();
      unsubConn();
    };
  }, []);

  // Milestone 3, 4, 5, 6: Audio Tap, Downsampling, and VERA AI Pipeline
  useEffect(() => {
    if (callState === 'CONNECTED' && remoteStream) {
      console.log('[VoIP] Engaging VERA remote audio tap for incoming stream');
      remoteAudioTap.start(remoteStream);
      setIsAudioTapActive(true);
      setChunksProcessedCount(0);
      setLastChunk(null);
      setFullTranscript('');
      setDetectedSignals([]);
      audioChunkAccumulator.reset();

      // Connect VERA AI Analysis Session (isolated failure domain)
      veraPipeline.startSession(peerId || 'remote_peer').then((sessionId) => {
        if (sessionId) {
          setVeraSessionId(sessionId);
          setIsAiConnected(true);
        }
      });
    } else {
      if (remoteAudioTap.getIsActive()) {
        console.log('[VoIP] Stopping VERA audio tap, chunk buffer, and AI session');
        remoteAudioTap.stop();
        audioChunkAccumulator.flush();
        veraPipeline.stopSession();
        setIsAudioTapActive(false);
        setIsAiConnected(false);
        setVeraSessionId(null);
        setVeraTelemetry(null);
      }
    }
  }, [callState, remoteStream, peerId]);

  // Hook Audio Tap frames into Downsampler, Chunker, and VERA AI Pipeline
  useEffect(() => {
    const unsubFrames = remoteAudioTap.onFrame((frameData, sampleRate) => {
      const pcm16 = downsampleTo16k(frameData, sampleRate);
      audioChunkAccumulator.feed(pcm16);
    });

    const unsubChunks = audioChunkAccumulator.onChunk((chunk) => {
      setChunksProcessedCount((c) => c + 1);
      setLastChunk(chunk);
      veraPipeline.sendChunk(chunk.index, chunk.wavBuffer);
    });

    const unsubTelemetry = veraPipeline.onTelemetry((telemetry) => {
      setVeraTelemetry(telemetry);
      setIsAiConnected(true);

      // Accumulate transcript from Whisper
      if (telemetry.transcript && typeof telemetry.transcript === 'string') {
        const clean = telemetry.transcript.trim();
        if (clean && clean !== '???' && clean !== '...') {
          setFullTranscript((prev) => {
            if (!prev) return clean;
            if (prev.endsWith(clean)) return prev;
            return `${prev} ${clean}`;
          });
        }
      }

      // Track contributing signals
      if (telemetry.signals && Array.isArray(telemetry.signals)) {
        setDetectedSignals(telemetry.signals);
      }
    });

    return () => {
      unsubFrames();
      unsubChunks();
      unsubTelemetry();
    };
  }, []);

  // Audio level listener for VU meter
  useEffect(() => {
    const unsubLevel = remoteAudioTap.onLevel((lvl) => {
      setRemoteAudioLevel(lvl);
    });
    return () => {
      unsubLevel();
    };
  }, []);

  // Timer for connected call
  useEffect(() => {
    if (callState === 'CONNECTED') {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (callState === 'IDLE') {
        setCallDuration(0);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Connect signaling on currentUser change
  useEffect(() => {
    signalingService.connect(currentUser);

    const unsubscribe = signalingService.onMessage(async (msg: SignalingMessage) => {
      console.log('[useVoIPSignaling] Event received:', msg.type);

      switch (msg.type) {
        case 'users:list':
          if (msg.users) {
            setOnlineUsers(msg.users);
          }
          break;

        case 'call:invite':
          if (msg.call_id && msg.caller_id) {
            setIncomingCallData({ caller_id: msg.caller_id, call_id: msg.call_id });
            setActiveCallId(msg.call_id);
            setPeerId(msg.caller_id);
            setCallState('INCOMING_RINGING');
            signalingService.sendRinging(msg.caller_id, msg.call_id);
          }
          break;

        case 'call:ringing':
          if (msg.call_id) {
            setCallState('OUTGOING_RINGING');
          }
          break;

        case 'call:accept':
          if (msg.call_id && peerId) {
            setCallState('CONNECTED');
            try {
              await webrtcManager.startAsCaller(peerId, msg.call_id);
            } catch (err) {
              console.error('[VoIP] Error starting caller WebRTC:', err);
            }
          }
          break;

        case 'call:reject':
          setCallState('ENDED');
          remoteAudioTap.stop();
          audioChunkAccumulator.flush();
          veraPipeline.stopSession();
          webrtcManager.cleanup();
          setTimeout(() => {
            setCallState('IDLE');
            setActiveCallId(null);
            setPeerId(null);
            setIncomingCallData(null);
          }, 2500);
          break;

        case 'call:end':
          setCallState('ENDED');
          remoteAudioTap.stop();
          audioChunkAccumulator.flush();
          veraPipeline.stopSession();
          webrtcManager.cleanup();
          setTimeout(() => {
            setCallState('IDLE');
            setActiveCallId(null);
            setPeerId(null);
            setIncomingCallData(null);
          }, 2000);
          break;

        // WebRTC Signaling Events
        case 'webrtc:offer':
          if (msg.sdp) {
            await webrtcManager.handleOffer(msg.sdp);
          }
          break;

        case 'webrtc:answer':
          if (msg.sdp) {
            await webrtcManager.handleAnswer(msg.sdp);
          }
          break;

        case 'webrtc:ice':
          if (msg.candidate) {
            await webrtcManager.handleIceCandidate(msg.candidate);
          }
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, peerId]);

  // Call Actions
  const initiateCall = useCallback((calleeId: string) => {
    const callId = 'call_' + Math.random().toString(36).substring(2, 9);
    setActiveCallId(callId);
    setPeerId(calleeId);
    setCallState('OUTGOING_RINGING');
    signalingService.sendInvite(calleeId, callId);
  }, []);

  const acceptIncomingCall = useCallback(async () => {
    if (incomingCallData) {
      setCallState('CONNECTED');
      signalingService.sendAccept(incomingCallData.caller_id, incomingCallData.call_id);
      
      try {
        await webrtcManager.startAsCallee(incomingCallData.caller_id, incomingCallData.call_id);
      } catch (err) {
        console.error('[VoIP] Error starting callee WebRTC:', err);
      }

      setIncomingCallData(null);
    }
  }, [incomingCallData]);

  const rejectIncomingCall = useCallback((reason: string = 'declined') => {
    if (incomingCallData) {
      signalingService.sendReject(incomingCallData.caller_id, incomingCallData.call_id, reason);
      remoteAudioTap.stop();
      audioChunkAccumulator.flush();
      veraPipeline.stopSession();
      webrtcManager.cleanup();
      setCallState('IDLE');
      setActiveCallId(null);
      setPeerId(null);
      setIncomingCallData(null);
    }
  }, [incomingCallData]);

  const endActiveCall = useCallback(() => {
    if (activeCallId) {
      signalingService.sendEnd(activeCallId, 'hangup');
    }
    remoteAudioTap.stop();
    audioChunkAccumulator.flush();
    veraPipeline.stopSession();
    webrtcManager.cleanup();
    setCallState('ENDED');
    setTimeout(() => {
      setCallState('IDLE');
      setActiveCallId(null);
      setPeerId(null);
      setIncomingCallData(null);
    }, 1500);
  }, [activeCallId]);

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    webrtcManager.setMuted(nextMuted);
  }, [isMuted]);

  return {
    currentUser,
    switchUser,
    onlineUsers,
    callState,
    activeCallId,
    peerId,
    callDuration,
    incomingCallData,
    initiateCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endActiveCall,
    isMuted,
    toggleMute,
    webrtcState,
    remoteStream,
    isAudioTapActive,
    remoteAudioLevel,
    chunksProcessedCount,
    lastChunk,
    veraSessionId,
    veraTelemetry,
    isAiConnected,
    fullTranscript,
    detectedSignals,
  };
}
