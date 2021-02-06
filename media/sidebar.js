// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
  const vscode = acquireVsCodeApi();

  // Login
  const loginWrapper = document.getElementById("login-wrapper");
  const loginInput = document.getElementById("login-input");
  const loginButton = document.getElementById("login-button");
  // Welcome
  const welcomeWrapper = document.getElementById("welcome-wrapper");
  const welcome = document.getElementById("welcome");
  // Create Session
  const createSessionWrapper = document.getElementById("create-session-wrapper");
  const createSessionButton = document.getElementById("create-session");
  const createIsPublic = document.getElementById("create-is-public");
  // Join Private Session
  const joinPrivateWrapper = document.getElementById("join-private-wrapper");
  const joinPrivateUsername = document.getElementById("join-private-username");
  const joinPrivateKey = document.getElementById("join-private-key");
  const joinPrivateButton = document.getElementById("join-private-button");
  // Owned Session
  const ownedSessionWrapper = document.getElementById("owned-session-wrapper");
  const ownedSessionKey = document.getElementById("owned-session-key");
  const ownedSessionClient = document.getElementById("owned-session-client");
  const ownedSessionCloseButton = document.getElementById("owned-session-close-button");
  // Joined Session
  const joinedSessionWrapper = document.getElementById("joined-session-wrapper");
  const joinedSessionClient = document.getElementById("joined-session-client");
  const joinedSessionLeaveButton = document.getElementById("joined-session-leave-button");
  // Other Clients
  const otherClientsWrapper = document.getElementById("other-clients-wrapper");
  const otherClientsList = document.getElementById("other-clients-list");

  // Initial setup
  loginWrapper.style.display = "block";
  welcomeWrapper.style.display = "none";

  createSessionWrapper.style.display = "block";
  joinPrivateWrapper.style.display = "block";
  joinPrivateWrapper.style.display = "block";
  otherClientsWrapper.style.display = "block";

  ownedSessionWrapper.style.display = "none";
  joinedSessionWrapper.style.display = "none";

  // Button Event Listeners

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

  createSessionButton.addEventListener("click", (event) => {
    event.preventDefault();
    const isPublic = createIsPublic.checked;

    vscode.postMessage({
      type: "createSession",
      payload: {
        isPublic,
      },
    });
  });

  joinPrivateButton.addEventListener("click", (event) => {
    event.preventDefault();
    const usernameInput = joinPrivateUsername.value;
    const keyInput = joinPrivateKey.value;
    vscode.postMessage({
      type: "joinPrivateSession",
      payload: {
        key: keyInput,
        username: usernameInput,
      },
    });
  });

  ownedSessionCloseButton.addEventListener("click", (event) => {
    event.preventDefault();
    vscode.postMessage({
      type: "closeSession",
    });
  });

  joinedSessionLeaveButton.addEventListener("click", (event) => {
    event.preventDefault();
    vscode.postMessage({
      type: "leaveSession",
    });
  });

  // Functions

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
      const { isPublic, joinable } = session;
      console.log(ip, session, isPublic, joinable);

      const listItem = document.createElement("li");
      listItem.style.display = "flex";
      listItem.style.justifyContent = "space-between";

      const usernameSpan = document.createElement("span");
      usernameSpan.innerHTML = username;
      listItem.appendChild(usernameSpan);

      if (isPublic && joinable) {
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

  const onSessionCreated = (key) => {
    createSessionWrapper.style.display = "none";
    ownedSessionWrapper.style.display = "block";
    ownedSessionKey.innerHTML = `Your session key: ${key}`;
  };

  const onSessionStarted = (payload) => {
    const { username } = payload;
    ownedSessionClient.innerHTML = `Connected with: ${username}`;
  };

  const onJoinAccepted = (payload) => {
    const { username } = payload;
    createSessionWrapper.style.display = "none";
    joinPrivateWrapper.style.display = "none";
    joinedSessionWrapper.style.display = "block";
    joinedSessionClient.innerHTML = `Connected with: ${username}`;
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
      case "sessionCreated":
        onSessionCreated(payload);
        break;
      case "joinAccepted":
        onJoinAccepted(payload);
        break;
      case "sessionStarted":
        onSessionStarted(payload);
        break;
    }
  });
})();
