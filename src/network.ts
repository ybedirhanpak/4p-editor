import * as net from "net";
import * as dgram from "dgram";
import { UIData } from "./ui/SidebarProvider";
import { Session, Message, MessageType } from "./message";

const DEFAULT_TCP_PORT = 12345;
const DEFAULT_UDP_PORT = 12346;
const DISCOVERY_BULK = 3;
const DISCOVERY_INTERVAL = 60 * 1000;
var sessionParameters: [string, string];

export interface ClientStatus {
  username: string;
  ip: string;
  session: Session;
}

export class Client {
  public username = "";
  public session: Session = {
    isPublic: false,
    joinable: false
  };
  private key = "" ;
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
      console.log("Listening on :", server.address());
    });

    server.on("connection", (conn) => {
      console.log("Connection from", conn.remoteAddress + ":" + conn.remotePort);
      conn.on("data", (data) => {
        if (conn.remoteAddress) {
          this.handleReceivedMessage(JSON.parse(data.toString()), conn.remoteAddress);
        } else {
          console.log("Address couldn't be found", conn.remoteAddress + ":" + conn.remotePort);
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
      console.log(`Server is listening at: ${ip}:${port}`);
    });

    server.on("message", (message, remoteInfo) => {
      console.log("Server received:", message.toString());
      console.log("Remote info:", remoteInfo);
      this.handleBroadcastMessage(JSON.parse(message.toString()), remoteInfo.address);
    });

    server.on("error", (error) => {
      console.log("Error:", error);
      server.close();
    });

    server.on("close", () => {
      console.log("Server is closed.");
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
    client.send(dataString, 0, dataString.length, port, "192.168.1.255", (error) => {
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
    // TODO: Implement this function
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
    this.sendDiscovery();
  }

  public logout() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }
    this.sendGoodbye();
  }

  
  
  
  public createSession(isPublic: boolean, joinable: boolean): Session{
      // TODO: Generate key for this session
    // TODO: Implement this function
    const key = Math.random().toString(36).substring(7);
    this.session = {
      isPublic: isPublic,
      joinable: joinable
    };
    this.key= key;


    const statusUpdateMessage = this.createMessage(MessageType.status, this.session );
    this.sendUDPBroadcast(12345,statusUpdateMessage);


    return  this.session;

  }
  public joinPublicSession(username: string) {
    // TODO: Implement this function  
    sessionParameters= [username,""];

    const joinPublicSessionMessage = this.createMessage(MessageType.joinSession,sessionParameters);
    this.sendDataTCP("", 12345, joinPublicSessionMessage);
  }

  public joinPrivateSession(username: string, key: string) {
    // TODO: Implement this function
    sessionParameters= [username,key];

    const joinPrivateSessionMessage = this.createMessage(MessageType.joinSession, sessionParameters);
    this.sendDataTCP("", 12345, joinPrivateSessionMessage);

  }

  public leaveSession(username: string) {
    // TODO: Implement this function
    sessionParameters= [username,""];

    this.session = {
      isPublic: false,
      joinable: false
    };

    const leaveSessionMessage = this.createMessage(MessageType.leaveSession, sessionParameters);
    this.sendDataTCP("", 12345, leaveSessionMessage);


    const statusUpdateMessage = this.createMessage(MessageType.status );
    this.sendUDPBroadcast(12345, statusUpdateMessage);

  }


  // IF public session --> key is "" so this parameter will always
  // be used except its a private session
  // this handles the sessin join request of a other user
  public handleSessionJoin(key : string) {
    // TODO: Implement this function
    if (this.key === key && this.session.joinable === true){
      this.session.joinable = false;}
   
      const statusUpdateMessage = this.createMessage(MessageType.status, );

    const responseSessionMessage = this.createMessage(MessageType.leaveSession, "success");
    this.sendDataTCP("", 12345, responseSessionMessage);

  }


  // handles the response of a session join request --> if payload succes --> session is joined
  public handleResponseSessionJoin(message: Message) {

    // TODO: Implement this function
    if (message.payload === "success"){
      message.session.joinable = false;
      this.session = message.session;
      const statusUpdateMessage = this.createMessage(MessageType.status);
      this.sendUDPBroadcast(12345,statusUpdateMessage);
        }
  }

  public endSession() {
    // TODO: Implement this function
    sessionParameters= [this.username,""];
    this.session = {
      isPublic: false,
      joinable: false
    };
    const closeSessionMessage = this.createMessage(MessageType.leaveSession, sessionParameters);
    this.sendDataTCP("", 12345, closeSessionMessage);

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