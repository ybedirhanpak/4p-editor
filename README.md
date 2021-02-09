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

## Challenges
-The Documentation of the Visual Studio code Extension API is missing at some points further explanaations and led to massive missunderstading on how to use it. Since developing extensions for visual studio code is not widely spread we also had struggles finding code examples and sample project. We had to cope this with investing a lot of time checking every method.
-Since we use a listener to detect new changes in our current open file editor we were stuck with infinite loops for a long time. This was caused by listerener being active as soon as we make changes on the file and aswell(!) when the other user makes a change on our file. If the change comes from the other user we send it back to him and he would then send it back to us since every change in the file is detecting by the listener. This lead to infinite loops after every change we did. We cope this by using temporary variables which save explicitly the change we did and then checks after receiving data if this data is euqal as our prior saved temp var.
- Fast file changes led to mixed up  or missing characters appearing in the receiving text editor. This was caused by using a single nodeJS event for handleing new text changes in the receiving text editor. We cope this by switching to multiple NodeJS Events by using nodejs-async-lock. This implemented mutual exclusion between events and led to more accurate handling of changes where only one edit happens at the same time.
