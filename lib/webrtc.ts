export interface WebRTCConfig {
  iceServers: RTCIceServer[]
}

export const webrtcConfig: WebRTCConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:your-turn-server.com:3478",
      username: process.env.NEXT_PUBLIC_TURN_USERNAME || "",
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || "",
    },
  ],
}

export class WebRTCConnection {
  private peerConnection: RTCPeerConnection
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private dataChannel: RTCDataChannel | null = null
  private onRemoteStreamCallback?: (stream: MediaStream) => void
  private onDataChannelMessageCallback?: (message: any) => void

  constructor(config: WebRTCConfig = webrtcConfig) {
    this.peerConnection = new RTCPeerConnection(config)
    this.setupPeerConnection()
  }

  private setupPeerConnection() {
    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0]
      this.onRemoteStreamCallback?.(this.remoteStream)
    }

    // Handle data channel
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel
      channel.onmessage = (event) => {
        this.onDataChannelMessageCallback?.(JSON.parse(event.data))
      }
    }

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate through signaling server
        this.sendSignalingMessage({
          type: "ice-candidate",
          candidate: event.candidate,
        })
      }
    }
  }

  async initializeLocalStream(
    constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
        facingMode: "user",
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    },
  ) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)

      // Add tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream!)
      })

      return this.localStream
    } catch (error) {
      console.error("Error accessing media devices:", error)
      throw error
    }
  }

  async createOffer() {
    // Create data channel for ASL-specific features
    this.dataChannel = this.peerConnection.createDataChannel("asl-data", {
      ordered: true,
    })

    this.dataChannel.onmessage = (event) => {
      this.onDataChannelMessageCallback?.(JSON.parse(event.data))
    }

    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)
    return offer
  }

  async createAnswer(offer: RTCSessionDescriptionInit) {
    await this.peerConnection.setRemoteDescription(offer)
    const answer = await this.peerConnection.createAnswer()
    await this.peerConnection.setLocalDescription(answer)
    return answer
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    await this.peerConnection.setRemoteDescription(answer)
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    await this.peerConnection.addIceCandidate(candidate)
  }

  sendDataChannelMessage(message: any) {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(JSON.stringify(message))
    }
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback
  }

  onDataChannelMessage(callback: (message: any) => void) {
    this.onDataChannelMessageCallback = callback
  }

  private sendSignalingMessage(message: any) {
    // This will be implemented with the signaling server
    window.dispatchEvent(new CustomEvent("webrtc-signaling", { detail: message }))
  }

  async startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      })

      // Replace video track
      const videoTrack = screenStream.getVideoTracks()[0]
      const sender = this.peerConnection.getSenders().find((s) => s.track && s.track.kind === "video")

      if (sender) {
        await sender.replaceTrack(videoTrack)
      }

      return screenStream
    } catch (error) {
      console.error("Error starting screen share:", error)
      throw error
    }
  }

  async stopScreenShare() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      const sender = this.peerConnection.getSenders().find((s) => s.track && s.track.kind === "video")

      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack)
      }
    }
  }

  disconnect() {
    this.localStream?.getTracks().forEach((track) => track.stop())
    this.peerConnection.close()
  }
}
