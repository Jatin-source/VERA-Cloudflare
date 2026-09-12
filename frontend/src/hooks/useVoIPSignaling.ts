import { useState, useEffect, useRef, useCallback } from 'react';
import { signalingService } from '../services/signaling';
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

  const timerRef = useRef<any>(null);

  // Switch identity
  const switchUser = useCallback((newUser: string) => {
    const clean = newUser.trim();
    if (!clean) return;
    localStorage.setItem('vera_voip_user', clean);
    setCurrentUser(clean);
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

    const unsubscribe = signalingService.onMessage((msg: SignalingMessage) => {
      console.log('[useVoIPSignaling] Event received:', msg);

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
            // Send back ringing acknowledgment
            signalingService.sendRinging(msg.caller_id, msg.call_id);
          }
          break;

        case 'call:ringing':
          if (msg.call_id) {
            setCallState('OUTGOING_RINGING');
          }
          break;

        case 'call:accept':
          if (msg.call_id) {
            setCallState('CONNECTED');
          }
          break;

        case 'call:reject':
          setCallState('ENDED');
          setTimeout(() => {
            setCallState('IDLE');
            setActiveCallId(null);
            setPeerId(null);
            setIncomingCallData(null);
          }, 2500);
          break;

        case 'call:end':
          setCallState('ENDED');
          setTimeout(() => {
            setCallState('IDLE');
            setActiveCallId(null);
            setPeerId(null);
            setIncomingCallData(null);
          }, 2000);
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // Call Actions
  const initiateCall = useCallback((calleeId: string) => {
    const callId = 'call_' + Math.random().toString(36).substring(2, 9);
    setActiveCallId(callId);
    setPeerId(calleeId);
    setCallState('OUTGOING_RINGING');
    signalingService.sendInvite(calleeId, callId);
  }, []);

  const acceptIncomingCall = useCallback(() => {
    if (incomingCallData) {
      setCallState('CONNECTED');
      signalingService.sendAccept(incomingCallData.caller_id, incomingCallData.call_id);
      setIncomingCallData(null);
    }
  }, [incomingCallData]);

  const rejectIncomingCall = useCallback((reason: string = 'declined') => {
    if (incomingCallData) {
      signalingService.sendReject(incomingCallData.caller_id, incomingCallData.call_id, reason);
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
    setCallState('ENDED');
    setTimeout(() => {
      setCallState('IDLE');
      setActiveCallId(null);
      setPeerId(null);
      setIncomingCallData(null);
    }, 1500);
  }, [activeCallId]);

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
  };
}
