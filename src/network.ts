import * as net from "net";
import * as dgram from "dgram";

const DEFAULT_TCP_PORT = 12345;
const DEFAULT_UDP_PORT = 12346;

export class Client {
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
        console.log("Server received data:", data.toString());
        conn.write(JSON.stringify({ message: "Hello Client!" }));
      });
    });
  }

  public sendDataTCP(host: string, port: number, data: any) {
    const client = new net.Socket();

    client.connect({ port, host }, () => {
      client.write(JSON.stringify(data));
    });

    client.on("data", (data) => {
      console.log("Client received data:", data.toString());
      client.end();
    });
  }

  login = (username: string) => {
    console.log("Client log in with", username);
  };

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

      server.send(
        "Hello Client!",
        remoteInfo.port,
        remoteInfo.address,
        (error) => {
          if (error) {
            console.log("Server got an error while sending message:", error);
          }
        }
      );
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

  public sendUDPData(host: string, port: number = DEFAULT_UDP_PORT, data: any) {
    const client = dgram.createSocket("udp4");

    client.on("message", function (message, remoteInfo) {
      console.log("Client received:", message.toString());
      console.log("Remote info:", remoteInfo);
      client.close();
    });

    client.send(data, port, host, (error) => {
      if (error) {
        if (error) {
          console.log("Client got an error while sending message:", error);
        }
      }
    });
  }

  public sendUDPBroadcast(port: number = DEFAULT_UDP_PORT, data: any) {
    const client = dgram.createSocket("udp4");

    client.bind(0, undefined, () => {
      client.setBroadcast(true);
    });

    client.send(data, 0, data.length, port, "192.168.1.255");

    client.on("message", function (message, remoteInfo) {
      console.log("Client received:", message.toString());
      console.log("Remote info:", remoteInfo);
      client.close();
    });
  }
}
