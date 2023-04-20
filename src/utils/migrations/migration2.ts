import { readFile } from "../../native-api/filesystem";
import {
  getPreferencesItem,
  removePreferencesItem,
  setPreferencesItem,
} from "../../native-api/preferences";
import { CloudFileRef, createChecksum } from "../CloudStorage";
import { getDoneFilePath } from "../todo-files";

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

interface MigrateCloudFileRefsOptions {
  oldTodoRefs: Ref[];
  oldDoneRefs: Ref[];
  files: ReadResult[];
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
  let [oldTodoRefs, oldDoneRefs] = await Promise.all([
    getRefs("cloud-files"),
    getRefs("cloud-archive-files"),
  ]);

  if (oldTodoRefs.length === 0) {
    return;
  }

  // rewrite paths to done files
  oldDoneRefs = oldDoneRefs
    .map((ref) => {
      const oldTodoRef = oldTodoRefs.find(
        (r) => r.localFilePath === ref.localFilePath
      );
      const doneFilePath = getDoneFilePath(ref.localFilePath);
      const lastSync = oldTodoRef?.lastSync || ref.lastSync;
      if (doneFilePath) {
        return { ...ref, localFilePath: doneFilePath, lastSync };
      }
    })
    .filter((ref): ref is Ref => !!ref);

  const files = await Promise.all([
    ...oldTodoRefs.map(({ localFilePath }) =>
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

  const refs = await migrateCloudFileRefs({
    oldTodoRefs,
    oldDoneRefs,
    files: files.filter((file): file is ReadResult => !!file),
  });

  await setPreferencesItem("cloud-file-refs", JSON.stringify(refs));
  await removePreferencesItem("cloud-files" as any);
  await removePreferencesItem("cloud-archive-files" as any);
}

async function migrateCloudFileRefs({
  oldTodoRefs,
  oldDoneRefs,
  files,
}: MigrateCloudFileRefsOptions) {
  const todoFiles = files.filter(
    (file): file is ReadResult => file?.fileType === "todo"
  );
  const doneFiles = files.filter(
    (file): file is ReadResult => file?.fileType === "done"
  );

  const todoRefs: CloudFileRef[] = oldTodoRefs.map((ref) => ({
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

  return [...todoRefs, ...doneRefs];
}
