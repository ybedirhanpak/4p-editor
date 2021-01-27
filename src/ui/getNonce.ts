/**
 * Generates random string contining 32 random alphanumeric characters
 * Source: https://github.com/microsoft/vscode-extension-samples/blob/master/webview-sample/src/extension.ts
 */
export default () => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};
