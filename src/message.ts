export interface Session {
  isublic: boolean;
  joinable: boolean;
  key: string;

}

export enum MessageType {
  discover = "discover",
  goodbye = "goodbye",
  status = "status",
  document = "document",
  joinSession = "joinSession",
  responseSession = "responseSession",
  textChanges = "textChanges",
  leaveSession = "leaveSession",
  closeSession = "closeSession",
}

export interface Message {
  username: string;
  type: MessageType;
  payload: any;
  session: Session;
}
