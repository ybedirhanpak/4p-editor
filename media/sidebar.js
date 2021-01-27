// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
  const vscode = acquireVsCodeApi();
  const loginInput = document.getElementById("login-input");
  const loginButton = document.getElementById("login-button");

  loginButton.addEventListener("click", (event) => {
    event.preventDefault();
    const usernameInput = loginInput.value;
    vscode.postMessage({
      type: "login",
      value: {
        username: usernameInput,
      },
    });
  });
})();
