import { getPreferencesItem, setPreferencesItem } from "./preferences";

async function getTodoFilePaths() {
  const pathStr = await getPreferencesItem("todo-txt-paths");
  try {
    const paths: string[] = pathStr ? JSON.parse(pathStr) : [];
    return paths;
  } catch (e) {
    await setPreferencesItem("todo-txt-paths", JSON.stringify([]));
    return [];
  }
}

async function addTodoFilePath(filePath: string) {
  const filePathsStr = await getPreferencesItem("todo-txt-paths");

  let filePaths: string[] = [];
  try {
    if (filePathsStr) {
      filePaths = JSON.parse(filePathsStr);
    }
  } catch (e) {
    //
  }

  const alreadyExists = filePaths.some((p) => p === filePath);

  if (alreadyExists) {
    return;
  }

  await setPreferencesItem(
    "todo-txt-paths",
    JSON.stringify([...filePaths, filePath])
  );
}

async function removeTodoFilePath(filePath: string) {
  const filePathsStr = await getPreferencesItem("todo-txt-paths");
  let updatedFilePathsStr = JSON.stringify([]);

  if (filePathsStr) {
    try {
      const filePaths: string[] = JSON.parse(filePathsStr);
      const updatedFilePaths = filePaths.filter((path) => path !== filePath);
      updatedFilePathsStr = JSON.stringify(updatedFilePaths);
    } catch (e) {
      //
    }
  }

  await setPreferencesItem("todo-txt-paths", updatedFilePathsStr);
}

export { getTodoFilePaths, addTodoFilePath, removeTodoFilePath };
