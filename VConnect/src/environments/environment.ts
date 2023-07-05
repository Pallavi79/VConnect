export const environment = {
    production: false,
    wsEndpoint: 'ws://localhost:8081/',
    RTCPeerConfiguration: {
      iceServers: [
        {
          urls: 'stun:stun1.l.google.com:19302'
        }
      ]
    }
  };