// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
  const vscode = acquireVsCodeApi();
  const welcomeWrapper = document.getElementById("welcome-wrapper");
  const welcome = document.getElementById("welcome");
  const loginWrapper = document.getElementById("login-wrapper");
  const loginInput = document.getElementById("login-input");
  const loginButton = document.getElementById("login-button");
  const otherClientsList = document.getElementById("other-clients-list");

  // Initial setup
  welcomeWrapper.style.display = "none";
  loginWrapper.style.display = "block";

  loginButton.addEventListener("click", (event) => {
    event.preventDefault();
    const usernameInput = loginInput.value;
    vscode.postMessage({
      type: "login",
      payload: {
        username: usernameInput,
      },
    });
  });

  const onSuccessfulLogin = (username) => {
    loginWrapper.style.display = "none";
    welcomeWrapper.style.display = "block";
    welcome.innerHTML = `Welcome ${username}!`;
  };

  const updateOtherClients = (clientsMap) => {
    console.log("Update other clients", clientsMap);
    otherClientsList.innerHTML = "";

    Object.keys(clientsMap).forEach((username) => {
      const client = clientsMap[username];
      const { ip, session } = client;
      const { public, joinable } = session;
      console.log(ip, session, public, joinable);

      const listItem = document.createElement("li");
      listItem.style.display = "flex";
      listItem.style.justifyContent = "space-between";

      const usernameSpan = document.createElement("span");
      usernameSpan.innerHTML = username;
      listItem.appendChild(usernameSpan);

      if (public && joinable) {
        const joinAnchor = document.createElement("a");
        joinAnchor.innerHTML = "Join";
        joinAnchor.style.cursor = "pointer";

        joinAnchor.addEventListener("click", (event) => {
          event.preventDefault();

          vscode.postMessage({
            type: "joinPublicSession",
            payload: {
              username,
            },
          });
        });

        listItem.appendChild(joinAnchor);
      }

      otherClientsList.appendChild(listItem);
    });
  };

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", async (event) => {
    console.log("Message received", event);
    const { type, payload } = event.data;
    switch (type) {
      case "successfulLogin":
        onSuccessfulLogin(payload);
        break;
      case "updateOtherClients":
        updateOtherClients(payload);
        break;
    }
  });
})();
