import { Injectable } from '@angular/core';
import {Subject,Observable} from 'rxjs';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import { Message } from '../types/message';
import { environment } from 'src/environments/environment';


export const WS_ENDPOINT = environment.wsEndpoint ; 
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  // private socket$!: WebSocketSubject<any>;
  // private messagesSubject = new Subject<Message>();
  // public messages$ = this.messagesSubject.asObservable();

  // constructor() {
  //   this.connect();
  // }

  // /**
  //  * Creates a new WebSocket subject and sends it to the messages subject
  //  */
  // public connect(): void {
  //   if (!this.socket$ || this.socket$.closed) {
  //     this.socket$ = this.getNewWebSocket();

  //     this.socket$.subscribe(
  //       // Called whenever there is a message from the server
  //       msg => {
  //         console.log('Received message of type: ' + msg.type);
  //         this.messagesSubject.next(msg);
  //       }
  //     );
  //   }
  // }

  // sendMessage(msg: Message): void {
  //   console.log('Sending message: ' + msg.type);
  //   this.socket$!.next(msg);
  // }

  // /**
  //  * Returns a custom WebSocket subject that reconnects after failure
  //  */
  // private getNewWebSocket(): WebSocketSubject<any> {
  //   return webSocket({
  //     url: WS_ENDPOINT,
  //     openObserver: {
  //       next: () => {
  //         console.log('[ChatService]: Connection established');
  //       }
  //     },
  //     closeObserver: {
  //       next: () => {
  //         console.log('[ChatService]: Connection closed');
  //         this.socket$ = this.getNewWebSocket();
  //       }
  //     }
  //   });
  // }

  private socket$: WebSocketSubject<any>;

  private messagesSubject = new Subject<Message>();
  public messages$ = this.messagesSubject.asObservable();

  /**
   * Creates a new WebSocket subject and send it to the messages subject
   * @param cfg if true the observable will be retried.
   */
  public connect(): void {

    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = this.getNewWebSocket();

      this.socket$.subscribe(
        // Called whenever there is a message from the server
        msg => {
          console.log('Received message of type: ' + msg.type);
          this.messagesSubject.next(msg);
        }
      );
    }
  }


  sendMessage(msg: Message): void {
    console.log('sending message: ' + msg.type);
    this.socket$.next(msg);
  }

  /**
   * Return a custom WebSocket subject which reconnects after failure
   */
  private getNewWebSocket(): WebSocketSubject<any> {
    return webSocket({
      url: WS_ENDPOINT,
      openObserver: {
        next: () => {
          console.log('[ChatService]: connection ok');
        }
      },
      closeObserver: {
        next: () => {
          console.log('[ChatService]: connection closed');
          this.socket$ = undefined;
          this.connect();
        }
      }
    });
  }
}
