import {
  getFilenameFromPath,
  getFileNameWithoutEnding,
} from "../native-api/filesystem";

const defaultFilePath = import.meta.env.VITE_DEFAULT_FILE_NAME!;

const defaultDoneFilePath = import.meta.env.VITE_ARCHIVE_FILE_NAME!;

function getDoneFilePath(todoFilePath: string) {
  const fileName = getFilenameFromPath(todoFilePath);
  const fileNameWithoutEnding = getFileNameWithoutEnding(fileName);
  if (!fileNameWithoutEnding) {
    return;
  }
  return fileName === defaultFilePath
    ? todoFilePath.replace(new RegExp(`${fileName}$`), defaultDoneFilePath)
    : todoFilePath.replace(
        new RegExp(`${fileName}$`),
        `${fileNameWithoutEnding}_${defaultDoneFilePath}`
      );
}

function getTodoFilePathFromDoneFilePath(doneFilePath: string) {
  const fileName = getFilenameFromPath(doneFilePath);
  return fileName === defaultDoneFilePath
    ? doneFilePath.replace(new RegExp(`${fileName}$`), defaultFilePath)
    : doneFilePath.replace(new RegExp(`_${defaultDoneFilePath}$`), ".txt");
}

function isDoneFilePath(filePath: string) {
  return filePath.endsWith(defaultDoneFilePath);
}

export {
  defaultFilePath,
  getDoneFilePath,
  getTodoFilePathFromDoneFilePath,
  isDoneFilePath,
};
