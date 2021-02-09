import * as vscode from "vscode";
import getNonce from "./getNonce";
import { Client } from "../network";

export interface UIData {
  type: string;
  payload: any;
}

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri, private readonly client: Client) {}

  public onClientMessage(data: UIData) {
    this._view?.webview.postMessage(data);
    switch (data.type) {
      case "showErrorMessage": {
        if (!data.payload) {
          return;
        }
        const { message } = data.payload;
        vscode.window.showErrorMessage(message);
        break;
      }
      case "showInfoMessage": {
        if (!data.payload) {
          return;
        }
        const { message } = data.payload;
        vscode.window.showInformationMessage(message);
        break;
      }
      default: {
        break;
      }
    }
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data: UIData) => {
      switch (data.type) {
        case "login": {
          if (!data.payload) {
            return;
          }
          const { username } = data.payload;
          this.client.login(username);
          vscode.window.showInformationMessage(`${username} logged in!`);
          break;
        }
        case "createSession": {
          if (!data.payload) {
            return;
          }
          const { isPublic } = data.payload;
          this.client.createSession(isPublic);
          vscode.window.showInformationMessage(`Session created!`);
          break;
        }
        case "joinPublicSession": {
          if (!data.payload) {
            return;
          }
          const { username } = data.payload;
          this.client.joinPublicSession(username);
          vscode.window.showInformationMessage(`Join public session of ${username}`);
          break;
        }
        case "joinPrivateSession": {
          if (!data.payload) {
            return;
          }
          const { username, key } = data.payload;
          this.client.joinPrivateSession(username, key);
          vscode.window.showInformationMessage(`Join private session of ${username}`);
          break;
        }
        case "closeSession": {
          this.client.closeSession();
          vscode.window.showInformationMessage(`Close Session`);
          break;
        }
        case "leaveSession": {
          this.client.leaveSession();
          vscode.window.showInformationMessage(`Leave Session`);
          break;
        }
        case "showInfoMessage": {
          if (!data.payload) {
            return;
          }
          vscode.window.showInformationMessage(data.payload);
          break;
        }
        case "showErrorMessage": {
          if (!data.payload) {
            return;
          }
          vscode.window.showErrorMessage(data.payload);
          break;
        }
        case "receiveFile": {
          this.initialySetFile(data.payload);
          break;
        }
        case "fetchLoginStatus": {
          this.client.fetchLoginStatus();
          break;
        }
        default: {
          break;
        }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  public initialySetFile(payload: vscode.TextDocument) {
    vscode.window.showTextDocument(payload);
  }
  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );

    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );

    const sidebarUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "sidebar.css")
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "sidebar.js")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <!--
          Use a content security policy to only allow loading images from https or from our extension directory,
          and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: message:payload style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleResetUri}" rel="stylesheet">
        <link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${sidebarUri}" rel="stylesheet">
      </head>
      <body>
        <div id="login-wrapper">
          <h2 class="mb-1">Login</h2>
          <input id="login-input" class="mb-1" type="text" />
          <button id="login-button">Login</button>
        </div>

        <div id="welcome-wrapper">
          <h2 id="welcome" class="mb-2 text-center bold"></h2>

          <section id="create-session-wrapper" class="section flex">
            <button id="create-public-session" class="mr-1 flex-1">Create Public Session</button>
            <button id="create-private-session" class="flex-1">Create Private Session</button>
          </section>

          <section id="join-private-wrapper" class="section">
            <input id="join-private-username" class="mb-1" type="text" name="join-private-username" placeholder="Username">
            <input id="join-private-key" class="mb-1" type="text" name="join-private-key" placeholder="Key">
            <button id="join-private-button">Join Private Session</button>
          </section>

          <section id="owned-session-wrapper" class="section">
            <h3 class="mb-2 text-center bold">Current Session</h3>
            <h3 id="owned-session-key" class="mb-1"></h3>
            <h3 id="owned-session-public" class="mb-1"></h3>
            <h3 id="owned-session-client" class="mb-1"></h3>
            <button id="owned-session-close-button" class="mt-1">Close Session</button>
          </section>

          <section id="joined-session-wrapper" class="section">
            <h3 class="mb-2 text-center bold">Current Session</h3>
            <h4 id="joined-session-client" class="mb-1"></h4>
            <button id="joined-session-leave-button" class="mt-1">Leave Session</button>
          </section>

          <section id="other-clients-wrapper" class="section">
            <h3 class="mb-2 text-center bold">Other clients</h3>
            <ul id="other-clients-list" class="client-list">
            </ul>
          </section>
        </div>
        <script nonce="${nonce}" src="${scriptUri}">
        </script>
      </body>
      </html>`;
  }
}
