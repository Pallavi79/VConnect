import { Injectable } from '@angular/core';
import {Subject} from 'rxjs';
import {environment} from '../../../environments/environment';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import { Message } from '../types/message';

export const WS_ENDPOINT = environment.wsEndpoint;

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private socket$: WebSocketSubject<Message>;
  private messagesSubject = new Subject<Message>();
  public messages$ = this.messagesSubject.asObservable();

  constructor() { }

  public connect():void{
    this.socket$ = this.getNewWebSocket();
    this.socket$.subscribe(msg=>{
      console.log('Received message of type:',msg.type);
      this.messagesSubject.next(msg);
    })
  }
  sendMessage(msg: Message): void {
    console.log('sending message: ' + msg.type);
    this.socket$.next(msg);
  }
  getNewWebSocket(): WebSocketSubject<Message> {
    return webSocket({
      url:WS_ENDPOINT,
      openObserver:{
        next:()=>{
          console.log('DataService : Connection OK')
        }
      },
      closeObserver:{
        next:()=>{
          console.log('DataService: Connection closed');
          this.socket$=undefined;
          this.connect();
        }
      }
    })
  }
}
