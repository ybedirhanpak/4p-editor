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
        case "onInfo": {
          if (!data.payload) {
            return;
          }
          vscode.window.showInformationMessage(data.payload);
          break;
        }
        case "onError": {
          if (!data.payload) {
            return;
          }
          vscode.window.showErrorMessage(data.payload);
          break;
        }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
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
          <h3>Login</h3>
          <input id="login-input" type="text"/>
          <button id="login-button">Login</button>
        </div>

        <div id="welcome-wrapper">
          <h3 id="welcome"></h3>

          <br/>
          <div id="create-session-wrapper">
            <input type="checkbox" id="create-is-public" name="create-is-public">
            <label for="create-is-public">Is public?</label><br>
            <button id="create-session">Create Session</button>
          </div>

          <br/>
          <div id="join-private-wrapper">
            <input type="text" id="join-private-username" name="join-private-username" placeholder="Username">
            <input type="text" id="join-private-key" name="join-private-key" placeholder="Key">
            <button id="join-private-button">Join Private Session</button>
          </div>

          <br/>
          <div id="owned-session-wrapper">
            <h3 id="owned-session-key"></h3>
            <h4 id="owned-session-client"></h4>
            <button id="owned-session-close-button">Close Session</button>
          </div>

          <br/>
          <div id="joined-session-wrapper">
            <h4 id="joined-session-client"></h4>
            <button id="joined-session-leave-button">Leave Session</button>
          </div>

          <div id="other-clients-wrapper">
            <h3>Other clients:</h3>
            <ul id="other-clients-list">
            </ul>
          </div>
        </div>
        <script nonce="${nonce}" src="${scriptUri}">
        </script>
      </body>
      </html>`;
  }
}
