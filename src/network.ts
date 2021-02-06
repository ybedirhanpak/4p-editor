import * as net from "net";
import * as dgram from "dgram";
import { UIData } from "./ui/SidebarProvider";
import { Session, Message, MessageType } from "./message";

const BROADCAST_ADDRESS = "25.255.255.255";
const DEFAULT_TCP_PORT = 12345;
const DEFAULT_UDP_PORT = 12346;
const DISCOVERY_BULK = 3;
const STATUS_BULK = 3;
const DISCOVERY_INTERVAL = 60000 * 1000; // 60 seconds

export interface ClientStatus {
  username: string;
  ip: string;
  session: Session;
}

export interface JoinPrivateRequest {
  key: string;
}

export interface JoinSessionRespone {
  accept: boolean;
  message?: string;
}

export class Client {
  public username = "";
  public session: Session = {
    isPublic: false,
    joinable: false,
  };
  private key = "";
  private joinedSession = "";
  private discoveryInterval: NodeJS.Timeout | undefined;
  private otherClients: { [username: string]: ClientStatus } = {};
  private uiProvider: any;

  constructor() {}

  public setUIProvider(uiProvider: any) {
    this.uiProvider = uiProvider;
  }

  private notifyUIProvider(data: UIData) {
    this.uiProvider?.onClientMessage(data);
  }

  public listenTCP(port = DEFAULT_TCP_PORT) {
    const server = net.createServer();

    server.listen(port, () => {
      console.log("TCP Listening on :", server.address());
    });

    server.on("connection", (conn) => {
      console.log("TCP Connection from", conn.remoteAddress + ":" + conn.remotePort);
      conn.on("data", (data) => {
        if (conn.remoteAddress) {
          this.handleReceivedMessage(JSON.parse(data.toString()), conn.remoteAddress);
        } else {
          console.log("TCP Address couldn't be found", conn.remoteAddress + ":" + conn.remotePort);
        }
      });
    });
  }

  public sendDataTCP(host: string, port: number, data: Message) {
    const client = new net.Socket();

    client.connect({ port, host }, () => {
      client.write(JSON.stringify(data));
      client.end();
    });
  }

  public listenUDP(port = DEFAULT_UDP_PORT) {
    const server = dgram.createSocket("udp4");

    server.on("listening", () => {
      const address = server.address();
      const port = address.port;
      const ip = address.address;
      console.log(`UDP Server is listening at: ${ip}:${port}`);
    });

    server.on("message", (message, remoteInfo) => {
      console.log("UDP Server received:", message.toString());
      console.log("UDP Remote info:", remoteInfo);
      this.handleBroadcastMessage(JSON.parse(message.toString()), remoteInfo.address);
    });

    server.on("error", (error) => {
      console.log("UDP Error:", error);
      server.close();
    });

    server.on("close", () => {
      console.log("UDP Server is closed.");
    });

    server.bind(port);
  }

  public sendUDPData(host: string, port: number = DEFAULT_UDP_PORT, data: Message) {
    const client = dgram.createSocket("udp4");

    client.send(JSON.stringify(data), port, host, (error) => {
      if (error) {
        console.log("Client got an error while sending message:", error);
      }
    });

    client.close();
  }

  public sendUDPBroadcast(port: number = DEFAULT_UDP_PORT, data: Message) {
    const client = dgram.createSocket("udp4");

    client.bind(0, undefined, () => {
      client.setBroadcast(true);
    });

    const dataString = JSON.stringify(data);
    client.send(dataString, 0, dataString.length, port, BROADCAST_ADDRESS, (error) => {
      if (error) {
        console.log("Client got an error while sending message:", error);
      }
      client.close();
    });
  }

  public createMessage(type: MessageType, payload?: any): Message {
    return {
      username: this.username,
      session: this.session,
      payload: payload,
      type: type,
    };
  }

  private saveClient(username: string, ip: string, session: Session) {
    this.otherClients[username] = { username, ip, session };
    this.notifyUIProvider({ type: "updateOtherClients", payload: this.otherClients });
  }

  private removeClient(username: string) {
    delete this.otherClients[username];
  }

  private handleBroadcastMessage(message: Message, ip: string) {
    console.log("Broadcast message received", message);
    const { username, type, session } = message;
    switch (type) {
      case MessageType.discover:
        // Add user into client dictionary
        this.saveClient(username, ip, session);
        // Send respond to client
        const responseMessage = this.createMessage(MessageType.discoverResponse);
        this.sendDataTCP(ip, DEFAULT_TCP_PORT, responseMessage);
        break;
      case MessageType.status:
        this.saveClient(username, ip, session);
        break;
      case MessageType.goodbye:
        // Remove user from client dictionary
        this.removeClient(username);
        break;
      default:
        break;
    }
  }

  private handleReceivedMessage(message: Message, ip: string) {
    console.log("Message received", message);
    const { username, type, session, payload } = message;

    switch (type) {
      case MessageType.discoverResponse:
        // Add user into client dictionary
        this.saveClient(username, ip, session);
        break;
      case MessageType.joinSession:
        this.handleSessionJoin(payload?.key, ip, username);
        break;
      case MessageType.responseSession:
        this.handleJoinSessionResponse(payload, username);
        break;
      case MessageType.leaveSession:
        this.handleLeaveSessionMessage(username);
        break;
      case MessageType.closeSession:
        this.handleCloseSessionMessage(username);
        break;
      default:
        break;
    }
  }

  private sendDiscovery() {
    const discoveryMessage = this.createMessage(MessageType.discover);

    // Send discovery multiple times
    for (let i = 0; i < DISCOVERY_BULK; i++) {
      this.sendUDPBroadcast(DEFAULT_UDP_PORT, discoveryMessage);
    }

    // Send discovery every minutes
    this.discoveryInterval = setInterval(() => {
      this.sendUDPBroadcast(DEFAULT_UDP_PORT, discoveryMessage);
    }, DISCOVERY_INTERVAL);
  }

  private sendStatus() {
    for (let i = 0; i < STATUS_BULK; i++) {
      const statusUpdateMessage = this.createMessage(MessageType.status);
      this.sendUDPBroadcast(DEFAULT_UDP_PORT, statusUpdateMessage);
    }
  }
  private sendGoodbye() {
    const goodbyeMessage = this.createMessage(MessageType.goodbye);

    // Send discovery multiple times
    for (let i = 0; i < DISCOVERY_BULK; i++) {
      this.sendUDPBroadcast(DEFAULT_UDP_PORT, goodbyeMessage);
    }
  }

  public login(username: string) {
    console.log("Client log in with", username);
    this.username = username;
    this.notifyUIProvider({ type: "successfulLogin", payload: username });
    this.listenUDP(DEFAULT_UDP_PORT);
    this.listenTCP(DEFAULT_TCP_PORT);
    this.sendDiscovery();
  }

  public logout() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }
    this.sendGoodbye();
  }

  public createSession(isPublic: boolean): string {
    this.session = {
      isPublic: isPublic,
      joinable: true,
    };

    this.sendStatus();

    const key = Math.random().toString(36).substring(7);
    this.key = key;

    this.notifyUIProvider({ type: "sessionCreated", payload: { key, isPublic } });
    return key;
  }

  public joinPublicSession(username: string) {
    const otherClient = this.otherClients[username];
    const { ip, session } = otherClient;

    if (session.joinable) {
      const joinPublicSessionMessage = this.createMessage(MessageType.joinSession);
      this.sendDataTCP(ip, DEFAULT_TCP_PORT, joinPublicSessionMessage);
    } else {
      // Let user know that the session is not joinable
      const message = "You cannot join this session.";
      this.notifyUIProvider({ type: "showErrorMessage", payload: { message } });
    }
  }

  public joinPrivateSession(username: string, key: string) {
    const joinRequest: JoinPrivateRequest = { key };

    // get ip from otherclients array and pass it to tcp send func
    const otherClient = this.otherClients[username];
    const { ip, session } = otherClient;

    if (session.joinable) {
      const joinPrivateSessionMessage = this.createMessage(MessageType.joinSession, joinRequest);
      this.sendDataTCP(ip, DEFAULT_TCP_PORT, joinPrivateSessionMessage);
    } else {
      // Let user know that the session is not joinable
      const message = "You cannot join this session.";
      this.notifyUIProvider({ type: "showErrorMessage", payload: { message } });
    }
  }

  // IF public session --> key is "" so this parameter will always
  // be used except its a private session
  // this handles the sessin join request of a other user
  public handleSessionJoin(key: string | undefined, ip: string, username: string) {
    if (!this.session.joinable) {
      this.respondToJoinSessionRequest(ip, false, "Rejected: Session is not joinable");
      return;
    }

    if (key) {
      // Private session
      if (key === this.key) {
        this.startSession(username);
        this.respondToJoinSessionRequest(ip, true);
      } else {
        this.respondToJoinSessionRequest(ip, false, "Rejected: Session Key is incorrect");
      }
    } else {
      // Public session
      this.startSession(username);
      this.respondToJoinSessionRequest(ip, true);
    }
  }

  public respondToJoinSessionRequest(ip: string, accept: boolean, message?: string) {
    const joinSessionRespone: JoinSessionRespone = { accept, message };
    const joinSessionResponseMessage = this.createMessage(
      MessageType.responseSession,
      joinSessionRespone
    );
    this.sendDataTCP(ip, DEFAULT_TCP_PORT, joinSessionResponseMessage);
  }

  public startSession(username: string) {
    this.session.joinable = false;
    this.joinedSession = username;
    this.sendStatus();

    this.notifyUIProvider({ type: "sessionStarted", payload: { username } });
    //TODO start making file exchange ... and text exchanges
  }

  // handles the response of a session join request --> if payload succes --> session is joined
  public handleJoinSessionResponse(payload: JoinSessionRespone, username: string) {
    const { accept, message } = payload;
    if (accept) {
      this.joinedSession = username;
      this.notifyUIProvider({ type: "joinAccepted", payload: { username } });
    } else {
      // Show user reject message
      this.notifyUIProvider({ type: "showErrorMessage", payload: { message } });
    }
  }

  public leaveSession() {
    if (!this.joinedSession) {
      // Let user know theres in no session to leave
      const message = "You cannot leave because you are not in a session";
      this.notifyUIProvider({ type: "showErrorMessage", payload: { message } });
      return;
    }
    const otherClient = this.otherClients[this.joinedSession];
    const { ip } = otherClient;

    const leaveSessionMessage = this.createMessage(MessageType.leaveSession);
    this.sendDataTCP(ip, DEFAULT_TCP_PORT, leaveSessionMessage);
  }

  public handleLeaveSessionMessage(username: string) {
    if (this.joinedSession === username) {
      this.joinedSession = "";
      this.session.joinable = true;
      this.sendStatus();
    }
  }

  public handleCloseSessionMessage(username: string) {
    if (this.joinedSession === username) {
      this.joinedSession = "";
      //TODO: stopp text exchange
    }
  }

  public closeSession() {
    if (!this.session.joinable) {
      // Let user know theres in no session to end
      const message = "You cannot close session because you haven't created one.";
      this.notifyUIProvider({ type: "showErrorMessage", payload: { message } });
      return;
    }
    const otherClient = this.otherClients[this.joinedSession];
    const { ip } = otherClient;

    const closeSessionMessage = this.createMessage(MessageType.closeSession);
    this.sendDataTCP(ip, DEFAULT_TCP_PORT, closeSessionMessage);

    this.joinedSession = "";
    this.session.joinable = false;
    this.session.isPublic = false;
    this.sendStatus();
  }

  public sendTextChanges() {
    // TODO: Define parameters
    // TODO: Implement this function
  }

  public handleTextChanges() {
    // TODO: Define parameters
    // TODO: Implement this function
  }
}
