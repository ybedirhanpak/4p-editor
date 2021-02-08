import * as vscode from "vscode";

const folders = vscode.workspace.workspaceFolders;
let ROOT_PATH = folders ? folders[0].uri.path : "";
if (ROOT_PATH.endsWith("/")) {
  ROOT_PATH.slice(0, ROOT_PATH.length - 1);
}

export const getRelativePath = (absPath: string) => {
  let result = absPath.split(ROOT_PATH)[1];
  if (result.startsWith("/")) {
    result = result.slice(1);
  }
  return result;
};

export const getAbsPath = (simpleName: string) => {
  return `${ROOT_PATH}/${simpleName}`;
};

export const generateOldPath = (simpleName: string) => {
  return `${ROOT_PATH}/${simpleName}.old`;
};

export const isOldFile = (name: string) => {
  return name.endsWith(".old");
};
