import { readFile } from "../native-api/filesystem";
import {
  getPreferencesItem,
  removePreferencesItem,
  setPreferencesItem,
} from "../native-api/preferences";
import { CloudFileRef, createChecksum } from "./CloudStorage";
import { getDoneFilePath } from "./todo-files";

// 1. Migration: todo-txt-path -> todo-txt-paths

export async function migrate1() {
  const todoFilePath = await getPreferencesItem("todo-txt-path" as any);
  if (todoFilePath) {
    await Promise.all([
      setPreferencesItem("todo-txt-paths", JSON.stringify([todoFilePath])),
      removePreferencesItem("todo-txt-path" as any),
    ]);
  }
}

// 2. Migration: cloud-files -> cloud-file-refs

interface Ref {
  name: string;
  path: string;
  rev: string;
  contentHash: string;
  lastSync: string;
  localFilePath: string;
  cloudStorage: string;
}

interface ReadResult {
  fileType: string;
  content: string;
  checksum: string;
  path: string;
}

async function getRefs(key: any): Promise<Ref[]> {
  const cloudFilesStr = await getPreferencesItem(key);
  return cloudFilesStr ? JSON.parse(cloudFilesStr) : [];
}

function getChecksum(files: ReadResult[], path: string) {
  const file = files.find((file) => file.path === path);
  if (file) {
    return file.checksum;
  }
  return "";
}

export async function migrate2() {
  // eslint-disable-next-line prefer-const
  let [oldRefs, oldDoneRefs] = await Promise.all([
    getRefs("cloud-files"),
    getRefs("cloud-archive-files"),
  ]);

  if (oldRefs.length === 0) {
    return;
  }

  // rewrite paths to done files
  oldDoneRefs = oldDoneRefs
    .map((ref) => {
      const doneFilePath = getDoneFilePath(ref.localFilePath);
      if (doneFilePath) {
        return { ...ref, localFilePath: doneFilePath };
      }
    })
    .filter((ref: any): ref is Ref => !!ref);

  const files = await Promise.all([
    ...oldRefs.map(({ localFilePath }) =>
      readFile(localFilePath)
        .then(async (content) => {
          const checksum = await createChecksum(content);
          return {
            fileType: "todo",
            content,
            checksum,
            path: localFilePath,
          };
        })
        .catch(() => {
          // ignore error
          return undefined;
        })
    ),
    ...oldDoneRefs.map(({ localFilePath }) =>
      readFile(localFilePath)
        .then(async (content) => {
          const checksum = await createChecksum(content);
          return {
            fileType: "done",
            content,
            checksum,
            path: localFilePath,
          };
        })
        .catch(() => {
          // no done file found
          return undefined;
        })
    ),
  ]);

  const todoFiles = files.filter(
    (file): file is ReadResult => file?.fileType === "todo"
  );
  const doneFiles = files.filter(
    (file): file is ReadResult => file?.fileType === "done"
  );

  const todoRefs: CloudFileRef[] = oldRefs.map((ref) => ({
    name: ref.name,
    path: ref.path,
    lastSync: ref.lastSync,
    lastModified: ref.rev,
    checksum: getChecksum(todoFiles, ref.localFilePath),
    provider: ref.cloudStorage as any,
    identifier: ref.localFilePath,
  }));

  const doneRefs: CloudFileRef[] = oldDoneRefs.map((ref) => ({
    name: ref.name,
    path: ref.path,
    lastSync: ref.lastSync,
    lastModified: ref.rev,
    checksum: getChecksum(doneFiles, ref.localFilePath),
    provider: ref.cloudStorage as any,
    identifier: ref.localFilePath,
  }));

  await setPreferencesItem(
    "cloud-file-refs",
    JSON.stringify([...todoRefs, ...doneRefs])
  );
  await removePreferencesItem("cloud-files" as any);
  await removePreferencesItem("cloud-archive-files" as any);
}
