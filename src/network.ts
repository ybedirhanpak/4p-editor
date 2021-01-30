import * as net from "net";
import * as dgram from "dgram";
import { Session, Message, MessageType } from "./message";

const DEFAULT_TCP_PORT = 12345;
const DEFAULT_UDP_PORT = 12346;

export class Client {
  public username = "";
  public session: Session = {
    public: false,
    joinable: false,
  };

  constructor() {}

  public listenTCP(port = DEFAULT_TCP_PORT) {
    const server = net.createServer();

    server.listen(port, () => {
      console.log("Listening on :", server.address());
    });

    server.on("connection", (conn) => {
      console.log(
        "Connection from",
        conn.remoteAddress + ":" + conn.remotePort
      );

      conn.on("data", (data) => {
        this.handleReceivedMessage(JSON.parse(data.toString()));
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
      this.handleBroadcastMessage(JSON.parse(message.toString()));
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

  public sendUDPData(
    host: string,
    port: number = DEFAULT_UDP_PORT,
    data: Message
  ) {
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
    client.send(dataString, 0, dataString.length, port, "192.168.1.255");
    client.close();
  }

  public createMessage(type: MessageType, payload: any): Message {
    return {
      username: this.username,
      session: this.session,
      payload: payload,
      type: type,
    };
  }

  private handleBroadcastMessage(message: Message) {
    console.log("Broadcast message received", message);
    // TODO: Implement this function
  }

  private handleReceivedMessage(message: Message) {
    console.log("Message received", message);
    // TODO: Implement this function
  }

  public login(username: string) {
    console.log("Client log in with", username);
    // TODO: Implement this function
  }

  public sendDiscovery() {
    // TODO: Implement this function
  }

  public sendGoodbye() {
    // TODO: Implement this function
  }

  public createSession() {
    // TODO: Generate key for this session
    // TODO: Implement this function
  }

  public joinPublicSession(username: string) {
    // TODO: Implement this function
  }

  public joinPrivateSession(username: string, key: string) {
    // TODO: Implement this function
  }

  public leaveSession(username: string) {
    // TODO: Implement this function
  }

  public endSession() {
    // TODO: Define parameters
    // TODO: Implement this function
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
