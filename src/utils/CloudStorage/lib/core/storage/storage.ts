import { DownloadFileOption, ListOptions, SyncFileOptions } from "../client";
import { CloudError, CloudStorageError } from "../errors";
import { WithPath } from "../types";
import { createChecksum } from "../utils";
import {
  DownloadFileResult,
  SyncFileResult,
  UploadFileOptions,
} from "./internal/types";
import { CloudStorage, CloudStorageConfiguration } from "./types";

export function createCloudStorage({
  client,
}: CloudStorageConfiguration): CloudStorage {
  function op<A extends object, R>(
    fn: (...args: A[]) => Promise<R>,
  ): (...args: A[]) => Promise<R> {
    return async (...args: A[]) => {
      try {
        return await fn(...args);
      } catch (error) {
        console.error("CloudStorage", error);
        const opt = args?.length > 0 ? (args[0] as any) : {};
        const path = opt.path ? opt.path : opt.ref ? opt.ref.path : "";
        if (error instanceof CloudStorageError) {
          throw error;
        }
        if (error instanceof CloudError) {
          throw new CloudStorageError({
            type: error.type,
            cause: error,
            provider: client.provider,
            path,
          });
        }
        throw new CloudStorageError({
          cause: error,
          provider: client.provider,
          path,
        });
      }
    };
  }

  const downloadFile = async (
    options: DownloadFileOption,
  ): Promise<DownloadFileResult> => {
    const { response, cloudFile } = await client.downloadFile(options);
    const content = await response.clone().arrayBuffer();
    const checksum = await createChecksum(content);
    const ref = {
      ...cloudFile,
      checksum,
      lastSync: new Date().toISOString(),
      provider: client.provider,
    };
    return { ref, response };
  };

  const uploadFile = async ({
    overwrite = true,
    ...other
  }: UploadFileOptions) => {
    const cloudFile = await client.uploadFile({ overwrite, ...other });
    const checksum = await createChecksum(other.content);
    return {
      ...cloudFile,
      checksum,
      lastSync: new Date().toISOString(),
      provider: client.provider,
    };
  };

  const getMetaData = async (options: WithPath) => {
    return client.getFileMetaData(options);
  };

  const deleteFile = async (options: WithPath) => {
    await client.deleteFile(options);
  };

  const syncFile = async (
    options: SyncFileOptions,
  ): Promise<SyncFileResult> => {
    const result = await client.syncFile(options);

    if (result.operation === "none") {
      const lastSync = new Date().toISOString();
      return { operation: "none", ref: { ...options.ref, lastSync } };
    }

    const checksum =
      result.operation === "download"
        ? await createChecksum(await result.response.clone().arrayBuffer())
        : options.content
        ? await createChecksum(options.content)
        : options.ref.checksum;

    const ref = {
      ...options.ref,
      ...result.cloudFile,
      checksum,
      lastSync: new Date().toISOString(),
    };

    if (result.operation === "download") {
      return {
        ref,
        operation: "download",
        response: result.response,
      };
    } else {
      return {
        ref,
        operation: "upload",
      };
    }
  };

  const list = async (options?: ListOptions) => {
    return client.list(options);
  };

  return {
    client,
    provider: client.provider,
    downloadFile: op(downloadFile),
    uploadFile: op(uploadFile),
    getMetaData: op(getMetaData),
    deleteFile: op(deleteFile),
    syncFile: op(syncFile),
    // @ts-ignore
    list: op(list),
  };
}
