import { getFilename, getFileNameWithoutExt } from "@/native-api/filesystem";

export const defaultTodoFilename = "todo.txt";
const defaultDoneFilename = "done.txt";

export function getDoneFilePath(todoFilePath: string) {
  const fileName = getFilename(todoFilePath);
  const fileNameWithoutEnding = getFileNameWithoutExt(fileName);
  if (!fileNameWithoutEnding) {
    return;
  }
  return fileName === defaultTodoFilename
    ? todoFilePath.replace(new RegExp(`${fileName}$`), defaultDoneFilename)
    : todoFilePath.replace(
        new RegExp(`${fileName}$`),
        `${fileNameWithoutEnding}_${defaultDoneFilename}`,
      );
}

export function getTodoFilePathFromDoneFilePath(doneFilePath: string) {
  const fileName = getFilename(doneFilePath);
  return fileName === defaultDoneFilename
    ? doneFilePath.replace(new RegExp(`${fileName}$`), defaultTodoFilename)
    : doneFilePath.replace(new RegExp(`_${defaultDoneFilename}$`), ".txt");
}

export function isDoneFilePath(filePath: string) {
  return filePath.endsWith(defaultDoneFilename);
}
