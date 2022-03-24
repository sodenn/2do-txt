import {
  DeleteFileOptions,
  ReaddirOptions,
  ReaddirResult,
  ReadFileOptions,
  ReadFileResult,
  WriteFileOptions,
} from "@capacitor/filesystem";

export { Directory, Encoding } from "@capacitor/filesystem";

export const Filesystem = {
  async readFile(options: ReadFileOptions): Promise<ReadFileResult> {
    throw new Error("[Filesystem Mock] File does not exist");
  },
  async writeFile(options: WriteFileOptions): Promise<void> {},
  async deleteFile(options: DeleteFileOptions): Promise<void> {},
  async readdir(options: ReaddirOptions): Promise<ReaddirResult> {
    return {
      files: [],
    };
  },
};
