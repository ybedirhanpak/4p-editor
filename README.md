# 4P Editor

This is a VSCode Extension called 4P Editor (Peer-to-peer pair programming Editor) which enables developers to create sessions for pair programming.

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
