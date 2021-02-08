// The module 'vscode' contains the VS Code extensibility API
import * as vscode from "vscode";
// Network
import { Client } from "./network";
import { MessageType } from "./message";
import { SamplePanel } from "./ui/SamplePanel";
import { SidebarProvider } from "./ui/SidebarProvider";

// This method is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {
  // This line of code will only be executed once when the extension is activated
  console.log("4p-editor is active!");
  const client = new Client();
  const sidebarProvider = new SidebarProvider(context.extensionUri, client);
  client.setUIProvider(sidebarProvider);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("4p-editor-sidebar", sidebarProvider)
  );

  // The "4p-editor.echo" command has been defined in the package.json file
  // "4p-editor.echo" must match the command field in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand("4p-editor.echo", () => {
      // Display a message box to the user
      vscode.window.showInformationMessage("Echo from 4p-editor!");
    })
  );

  // Show sample panel
  context.subscriptions.push(
    vscode.commands.registerCommand("4p-editor.showSamplePanel", () => {
      SamplePanel.createOrShow(context.extensionUri);
    })
  );

  let editor: vscode.TextEditor | undefined;
  let document: vscode.TextDocument | undefined;
  let changeSubscription: vscode.Disposable | undefined;

  // This is a test command for reading from and writing to text editor
  context.subscriptions.push(
    vscode.commands.registerCommand("4p-editor.startTestFileEdit", () => {
      vscode.window.showInformationMessage("Test edit started!");

      // This is like the current opened window in the VSCode screen
      editor = vscode.window.activeTextEditor;
      document = editor?.document;

      changeSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
        if (!document || !editor) {
          return;
        }

        // This function editor.edit() lets you modify the content of the current document
        editor.edit((editBuilder) => {
          // Detect changes in the editor and convert it to uppercase
          event.contentChanges.forEach((change) => {
            const previousText = document?.getText(change.range);
            console.log("Previous text:", previousText);
            console.log("Change text:", change.text);

            // Don't go crazy with infinite change cycle
            if (previousText === change.text) {
              return;
            }

            // I couldn't find a workaround with text with containing new lines. For now I disabled it to prevent infinite cycle
            if (change.text.includes("\n")) {
              return;
            }

            // The change.range gives you the range of the old content's range, not the range of the newly added content
            // Calculate the range where newly added content should be put into
            const replaceRange = new vscode.Range(
              change.range.start,
              new vscode.Position(
                change.range.end.line,
                change.range.start.character + change.text.length
              )
            );

            editBuilder.replace(replaceRange, change.text.toUpperCase());
          });
        });
      });

      // Subscriptions in context.subscriptions get disposed when the extension is deactivated
      context.subscriptions.push(changeSubscription);
    })
  );

  // This is a test command for reading from and writing to text editor
  context.subscriptions.push(
    vscode.commands.registerCommand("4p-editor.startSharingFileEdit", () => {
      vscode.window.showInformationMessage("Started Sharing File Edits!");

      // This is like the current opened window in the VSCode screen
      editor = vscode.window.activeTextEditor;
      document = editor?.document;

      changeSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
        if (!document || !editor) {
          return;
        }

        // This function editor.edit() lets you modify the content of the current document
        editor.edit((editBuilder) => {
          // Detect changes in the editor and convert it to uppercase
          event.contentChanges.forEach((change) => {
            // I couldn't find a workaround with text with containing new lines. For now I disabled it to prevent infinite cycle
            if (change.text.includes("\n")) {
              return;
            }

            // The change.range gives you the range of the old content's range, not the range of the newly added content
            // Calculate the range where newly added content should be put into
            const replaceRange = new vscode.Range(change.range.start, change.range.end);

            console.log("text ", change.text);
            console.log("range ", replaceRange);
             // client.sendTextChanges(replaceRange, change.text, "");
          });
        });
      });

      // Subscriptions in context.subscriptions get disposed when the extension is deactivated
      context.subscriptions.push(changeSubscription);
    })
  );

  // This is a the stop command for file test edit
  context.subscriptions.push(
    vscode.commands.registerCommand("4p-editor.stopTestFileEdit", () => {
      if (changeSubscription) {
        // Clear the document and editor so that they don't get affected by the extension because of 4p-editor.startTestFileEdit command
        document = undefined;
        editor = undefined;
        changeSubscription.dispose();
        vscode.window.showInformationMessage("Test edit stopped!");
      } else {
        vscode.window.showInformationMessage("Test edit is not working!");
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("4p-editor.testListen", async () => {
      client.listenTCP(8000);
      client.listenUDP(9000);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("4p-editor.testSendData", async () => {
      // This ip adress will dummy and will be different for different machines
      const message = client.createMessage(MessageType.discover);
      client.sendUDPBroadcast(9000, message);
    })
  );
}

// This method is called when the extension is deactivated
export function deactivate() {}
