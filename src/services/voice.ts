/**
 * Suspecto Real-Time WebRTC Voice Communication Service
 * Mesh audio connections across room participants with speaking volume detection
 */

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export type VoicePermissionStatus = 'prompt' | 'granted' | 'denied' | 'unsupported';

export class VoiceService {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private voiceCheckInterval: any = null;

  public isJoinedVoice: boolean = false;
  public isMuted: boolean = false;
  public isSpeaking: boolean = false;
  public permissionStatus: VoicePermissionStatus = 'prompt';
  public errorMessage: string | null = null;

  private onStateChangeCallback?: () => void;
  private sendSignalCallback?: (toPlayerId: string, signal: any) => void;
  private sendStatusCallback?: (isMuted: boolean, isSpeaking: boolean, isJoinedVoice: boolean) => void;

  constructor() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.permissionStatus = 'unsupported';
    }
  }

  public setCallbacks(
    onStateChange: () => void,
    sendSignal: (toPlayerId: string, signal: any) => void,
    sendStatus: (isMuted: boolean, isSpeaking: boolean, isJoinedVoice: boolean) => void
  ) {
    this.onStateChangeCallback = onStateChange;
    this.sendSignalCallback = sendSignal;
    this.sendStatusCallback = sendStatus;
  }

  public async joinVoice(): Promise<boolean> {
    if (this.isJoinedVoice) return true;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.permissionStatus = 'unsupported';
      this.errorMessage = 'Voice chat is not supported in this browser.';
      this.notifyChange();
      return false;
    }

    try {
      this.errorMessage = null;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      this.localStream = stream;
      this.isJoinedVoice = true;
      this.isMuted = false;
      this.permissionStatus = 'granted';

      // Setup audio analyzer for speaking volume detection
      this.setupAudioAnalyzer(stream);

      // Notify server of voice status
      if (this.sendStatusCallback) {
        this.sendStatusCallback(this.isMuted, this.isSpeaking, true);
      }

      this.notifyChange();
      return true;
    } catch (err: any) {
      console.warn('[Voice] Failed to get user media:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.permissionStatus = 'denied';
        this.errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
      } else {
        this.errorMessage = 'Could not access microphone: ' + (err.message || 'Unknown error');
      }
      this.isJoinedVoice = false;
      this.notifyChange();
      return false;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }

    if (muted && this.isSpeaking) {
      this.isSpeaking = false;
    }

    if (this.sendStatusCallback && this.isJoinedVoice) {
      this.sendStatusCallback(this.isMuted, this.isSpeaking, this.isJoinedVoice);
    }

    this.notifyChange();
  }

  public toggleMute() {
    this.setMuted(!this.isMuted);
  }

  public syncPeers(allPlayerIds: string[], myPlayerId: string) {
    if (!this.isJoinedVoice || !this.localStream) return;

    // Connect with any newly discovered peer in the room
    for (const peerId of allPlayerIds) {
      if (peerId === myPlayerId) continue;
      if (!this.peerConnections.has(peerId)) {
        this.createPeerConnection(peerId, myPlayerId);
      }
    }

    // Cleanup disconnected peers
    for (const [peerId, pc] of this.peerConnections.entries()) {
      if (!allPlayerIds.includes(peerId)) {
        pc.close();
        this.peerConnections.delete(peerId);
        const audio = this.remoteAudioElements.get(peerId);
        if (audio) {
          audio.srcObject = null;
          audio.remove();
          this.remoteAudioElements.delete(peerId);
        }
      }
    }
  }

  public async handleIncomingSignal(fromPlayerId: string, signal: any, myPlayerId: string) {
    if (!this.isJoinedVoice || !this.localStream) return;

    let pc = this.peerConnections.get(fromPlayerId);
    if (!pc) {
      pc = this.createPeerConnection(fromPlayerId, myPlayerId);
    }

    try {
      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (this.sendSignalCallback) {
          this.sendSignalCallback(fromPlayerId, answer);
        }
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (err) {
      console.warn(`[Voice] Error handling signal from ${fromPlayerId}:`, err);
    }
  }

  private createPeerConnection(peerId: string, myPlayerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.peerConnections.set(peerId, pc);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle remote audio stream
    pc.ontrack = (event) => {
      let audio = this.remoteAudioElements.get(peerId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        this.remoteAudioElements.set(peerId, audio);
      }
      audio.srcObject = event.streams[0];
      audio.play().catch(() => {});
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.sendSignalCallback) {
        this.sendSignalCallback(peerId, { candidate: event.candidate });
      }
    };

    // Polite peer pattern: If my ID is lexicographically lower, initiate the offer
    if (myPlayerId < peerId) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          if (this.sendSignalCallback) {
            this.sendSignalCallback(peerId, offer);
          }
        } catch (err) {
          console.warn(`[Voice] Negotiation failed with ${peerId}:`, err);
        }
      };
    }

    return pc;
  }

  private setupAudioAnalyzer(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let speakingDebounce = false;

      this.voiceCheckInterval = setInterval(() => {
        if (!this.analyser || this.isMuted || !this.isJoinedVoice) {
          if (this.isSpeaking) {
            this.isSpeaking = false;
            this.notifyStatusUpdate();
            this.notifyChange();
          }
          return;
        }

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const nowSpeaking = average > 18; // speaking threshold

        if (nowSpeaking !== this.isSpeaking) {
          if (nowSpeaking) {
            this.isSpeaking = true;
            speakingDebounce = true;
            this.notifyStatusUpdate();
            this.notifyChange();
          } else if (speakingDebounce) {
            // Keep speaking active for at least 300ms to prevent flickering
            speakingDebounce = false;
            setTimeout(() => {
              if (!speakingDebounce && this.isSpeaking) {
                this.isSpeaking = false;
                this.notifyStatusUpdate();
                this.notifyChange();
              }
            }, 300);
          }
        }
      }, 120);
    } catch (err) {
      console.warn('[Voice] Audio analyzer init failed:', err);
    }
  }

  private notifyStatusUpdate() {
    if (this.sendStatusCallback && this.isJoinedVoice) {
      this.sendStatusCallback(this.isMuted, this.isSpeaking, this.isJoinedVoice);
    }
  }

  private notifyChange() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback();
    }
  }

  public leaveVoice() {
    if (this.voiceCheckInterval) {
      clearInterval(this.voiceCheckInterval);
      this.voiceCheckInterval = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    for (const pc of this.peerConnections.values()) {
      pc.close();
    }
    this.peerConnections.clear();

    for (const audio of this.remoteAudioElements.values()) {
      audio.srcObject = null;
      audio.remove();
    }
    this.remoteAudioElements.clear();

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (_) {}
      this.audioContext = null;
    }

    const wasJoined = this.isJoinedVoice;
    this.isJoinedVoice = false;
    this.isMuted = false;
    this.isSpeaking = false;

    if (wasJoined && this.sendStatusCallback) {
      this.sendStatusCallback(true, false, false);
    }

    this.notifyChange();
  }
}

export const voiceService = new VoiceService();
