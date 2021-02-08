export interface Session {
  isPublic: boolean;
  joinable: boolean;
}

export enum MessageType {
  discover = "discover",
  discoverResponse = "discoverResponse",
  goodbye = "goodbye",
  status = "status",
  joinSession = "joinSession",
  responseSession = "responseSession",
  leaveSession = "leaveSession",
  closeSession = "closeSession",
  documentExchange = "documentExchange",
  textExchange = "textExchange",
  tabChange = "tabChange",
}

export interface Message {
  username: string;
  type: MessageType;
  payload: any;
  session: Session;
}
