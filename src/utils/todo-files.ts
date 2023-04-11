import { getFilename, getFileNameWithoutExt } from "../native-api/filesystem";

export const defaultTodoFilePath = "todo.txt";
export const defaultDoneFilePath = "done.txt";

export function getDoneFilePath(todoFilePath: string) {
  const fileName = getFilename(todoFilePath);
  const fileNameWithoutEnding = getFileNameWithoutExt(fileName);
  if (!fileNameWithoutEnding) {
    return;
  }
  return fileName === defaultTodoFilePath
    ? todoFilePath.replace(new RegExp(`${fileName}$`), defaultDoneFilePath)
    : todoFilePath.replace(
        new RegExp(`${fileName}$`),
        `${fileNameWithoutEnding}_${defaultDoneFilePath}`
      );
}

export function getTodoFilePathFromDoneFilePath(doneFilePath: string) {
  const fileName = getFilename(doneFilePath);
  return fileName === defaultDoneFilePath
    ? doneFilePath.replace(new RegExp(`${fileName}$`), defaultTodoFilePath)
    : doneFilePath.replace(new RegExp(`_${defaultDoneFilePath}$`), ".txt");
}

export function isDoneFilePath(filePath: string) {
  return filePath.endsWith(defaultDoneFilePath);
}
