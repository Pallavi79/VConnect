import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { DataService } from './service/data.service';
import { environment} from 'src/environments/environment';
import { Message } from './types/message';


export const ENV_RTCPeerConfiguration = environment.RTCPeerConfiguration;

const mediaConstraints = {
  audio: true,
  video: {width: 1280, height: 720}
};

const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements AfterViewInit{
  
  @ViewChild('local_video') localVideo: ElementRef;
  @ViewChild('received_video') remoteVideo: ElementRef;

  private localStream: MediaStream;
  private peerConnection: RTCPeerConnection;

  ngAfterViewInit(): void {
    this.addIncominMessageHandler();
    this.requestMediaDevices();
  }
  constructor(private dataService: DataService) { }

  private async requestMediaDevices(): Promise<void>{
    //throw new Error('Method not implemented.');
    this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
    this.localVideo.nativeElement.srcObject = this.localStream
  }


  pauseLocalVideo():void{
    this.localStream.getTracks().forEach(track=>{
      track.enabled=false;
      //track.stop();
    })
    this.localVideo.nativeElement.srcObject=undefined;
  }

  startLocalVideo():void{
    this.localStream.getTracks().forEach(track=>{
      track.enabled=true;
    })
    this.localVideo.nativeElement.srcObject=this.localStream
  }

  async call(): Promise<void> {
    this.createPeerConnection();

    this.localStream.getTracks().forEach(
      track => this.peerConnection.addTrack(track, this.localStream)
    );

    try {
      const offer: RTCSessionDescriptionInit = await this.peerConnection.createOffer(offerOptions);
      // Establish the offer as the local peer's current description.
      await this.peerConnection.setLocalDescription(offer);

      //this.inCall = true;

      this.dataService.sendMessage({type: 'offer', data: offer});
    } catch (err) {
      this.handleGetUserMediaError(err);
    }
  }

  private createPeerConnection(): void {
    console.log('creating PeerConnection...');
    this.peerConnection = new RTCPeerConnection(ENV_RTCPeerConfiguration);

    this.peerConnection.onicecandidate = this.handleICECandidateEvent;
    this.peerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
    this.peerConnection.onsignalingstatechange = this.handleSignalingStateChangeEvent;
    this.peerConnection.ontrack = this.handleTrackEvent;
  }

  private closeVideoCall(): void {
    console.log('Closing call');

    if (this.peerConnection) {
      console.log('--> Closing the peer connection');

      this.peerConnection.ontrack = null;
      this.peerConnection.onicecandidate = null;
      this.peerConnection.oniceconnectionstatechange = null;
      this.peerConnection.onsignalingstatechange = null;

      // Stop all transceivers on the connection
      this.peerConnection.getTransceivers().forEach(transceiver => {
        transceiver.stop();
      });

      // Close the peer connection
      this.peerConnection.close();
      this.peerConnection = null;

      //this.inCall = false;

    }
  }

  private handleGetUserMediaError(e: Error): void {
    switch (e.name) {
      case 'NotFoundError':
        alert('Unable to open your call because no camera and/or microphone were found.');
        break;
      case 'SecurityError':
      case 'PermissionDeniedError':
        // Do nothing; this is the same as the user canceling the call.
        break;
      default:
        console.log(e);
        alert('Error opening your camera and/or microphone: ' + e.message);
        break;
    }

    this.closeVideoCall();
  }

  private handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    console.log(event);
    if (event.candidate) {
      this.dataService.sendMessage({
        type: 'ice-candidate',
        data: event.candidate
      });
    }
  }

  private handleICEConnectionStateChangeEvent = (event: Event) => {
    console.log(event);
    switch (this.peerConnection.iceConnectionState) {
      case 'closed':
      case 'failed':
      case 'disconnected':
        this.closeVideoCall();
        break;
    }
  }

  private handleSignalingStateChangeEvent = (event: Event) => {
    console.log(event);
    switch (this.peerConnection.signalingState) {
      case 'closed':
        this.closeVideoCall();
        break;
    }
  }

  private handleTrackEvent = (event: RTCTrackEvent) => {
    console.log(event);
    this.remoteVideo.nativeElement.srcObject = event.streams[0];
  }

  private addIncominMessageHandler(): void {
    this.dataService.connect();

    // this.transactions$.subscribe();
    this.dataService.messages$.subscribe(msg=>{
      // console.log('Received message: ' + msg.type);
      switch (msg.type) {
        case 'offer':
          this.handleOfferMessage(msg.data);
          break;
        case 'answer':
          this.handleAnswerMessage(msg.data);
          break;
        case 'hangup':
          this.handleHangupMessage(msg);
          break;
        case 'ice-candidate':
          this.handleICECandidateMessage(msg.data);
          break;
        default:
          console.log('unknown message of type ' + msg.type);
      }
    })
  }

  private handleOfferMessage(msg: RTCSessionDescriptionInit): void {
    console.log('handle incoming offer');
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    if (!this.localStream) {
      this.startLocalVideo();
    }

    this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg))
      .then(() => {
        this.localVideo.nativeElement.srcObject = this.localStream;

        this.localStream.getTracks().forEach(
          track => this.peerConnection.addTrack(track, this.localStream)
        );

      }).then(() => {
      return this.peerConnection.createAnswer();

    }).then((answer) => {
      return this.peerConnection.setLocalDescription(answer);

    }).then(() => {
      this.dataService.sendMessage({type: 'answer', data: this.peerConnection.localDescription});

      //this.inCall = true;

    }).catch(this.handleGetUserMediaError);
  }

  private handleAnswerMessage(msg): void {
    console.log('handle incoming answer');
    this.peerConnection.setRemoteDescription(msg);
  }

  private handleHangupMessage(msg: Message): void {
    console.log(msg);
    this.closeVideoCall();
  }

  private handleICECandidateMessage(msg): void {
    this.peerConnection.addIceCandidate(msg).catch(this.reportError);
  }
  private reportError = (e: Error) => {
    console.log('got Error: ' + e.name);
    console.log(e);
  }

  hangUp(): void {
    this.dataService.sendMessage({type: 'hangup', data: ''});
    this.closeVideoCall();
  }

}
