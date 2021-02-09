# 4P Editor

This is a VSCode Extension called 4P Editor (Peer-to-peer pair programming Editor) which enables developers to create sessions for pair programming. Sessions can be either private or public. Public session can be directly joined while private session need a password which is genertated during session creation. After running the extension a user needs to open a file which is immediately shared with his paired session partner. Every openend file will be handled like this. Now every change a user makes on one file in his editor will be shown directly at the other users file.

This project is implemented in the scope of Boğaziçi University CMPE487 course.

## Contributors

- Yahya Bedirhan Pak
- Tahir Kaan Ögel

## Development

- In order to run the extension in your local, you need to first clone the repository and open it with VSCode:

```
git clone https://github.com/ybedirhanpak/4p-editor.git
code 4p-editor
```

- Then install the npm packages:

```
npm install
```

- Compile the application

```
npm run compile
```

- Launch setting called `Run Extension` is located in `.vscode/launch.json`, so you can either run the project with `F5` or open `Run` tab and select `Run Extension`.

- There will be another VSCode window opened for you to test the extension.

- Type `Command + Shift + P` for MacOS, or `Control + Shift + P` for Windows, to type extension commands.

- Select sidebar icon at the left and see the main control menu of the extension.

## Notes

If the extension window doesn't show up:

- try stopping and starting again
- try killing the terminal which is running "Building process".
