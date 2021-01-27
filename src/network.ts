import * as net from "net";

const DEFAULT_PORT = 8000;


export class Client {
  listen = (port = DEFAULT_PORT) => {
    const server = net.createServer();
  
    server.listen(port, () => {
      console.log("Listening on :", server.address());
    });
  
    server.on("connection", (conn) => {
      console.log("Connection from", conn.remoteAddress + ":" + conn.remotePort);
      conn.on("data", (data) => {
        console.log("Server received data:", data.toString());
        conn.write(JSON.stringify({ message: "Hello Client!" }));
      });
    });
  };
  
  sendData = (host: string, port: number, data: any) => {
    const client = new net.Socket();
  
    client.connect({ port, host }, () => {
      client.write(JSON.stringify(data));
    });
  
    client.on("data", (data) => {
      console.log("Client received data:", data.toString());
      client.end();
    });
  };

  login = (username: string) => {
    console.log("Client log in with", username);
  };
}
