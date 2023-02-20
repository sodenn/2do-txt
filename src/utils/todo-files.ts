import {
  getFilenameFromPath,
  getFileNameWithoutEnding,
} from "../native-api/filesystem";

const defaultFilePath = import.meta.env.VITE_DEFAULT_FILE_NAME!;

const defaultDoneFilePath = import.meta.env.VITE_ARCHIVE_FILE_NAME!;

function getDoneFilePath(filePath: string) {
  const fileName = getFilenameFromPath(filePath);
  const fileNameWithoutEnding = getFileNameWithoutEnding(fileName);
  if (!fileNameWithoutEnding) {
    return;
  }
  return fileName === defaultFilePath
    ? filePath.replace(new RegExp(`${fileName}$`), defaultDoneFilePath!)
    : filePath.replace(
        new RegExp(`${fileName}$`),
        `${fileNameWithoutEnding}_${defaultDoneFilePath}`
      );
}

export { defaultFilePath, getDoneFilePath };
