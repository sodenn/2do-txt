import { CloudStorageError } from "../errors";
import {
  createChecksum,
  isDateAfter,
  isDateBefore,
  isDateEqual,
  parseDate,
} from "../utils";
import {
  DownloadFile,
  GetFileMetaData,
  SyncFile,
  SyncFileOptions,
  SyncFileResult,
  UploadFile,
} from "./types";

export interface CreateSyncFileFunctionOptions {
  getFileMetaData: GetFileMetaData;
  uploadFile: UploadFile;
  downloadFile: DownloadFile;
}

export function createSyncFileFunction({
  getFileMetaData,
  uploadFile,
  downloadFile,
}: CreateSyncFileFunctionOptions): SyncFile {
  return async (options: SyncFileOptions): Promise<SyncFileResult> => {
    const { ref } = options;

    if (!options.content) {
      const cloudFile = await getFileMetaData({
        path: ref.path,
      });
      const outdated = isDateBefore(
        parseDate(ref.lastModified),
        parseDate(cloudFile.lastModified)
      );
      if (!outdated) {
        // no action needed
        return { operation: "none" };
      }
      const { response, cloudFile: _cloudFile } = await downloadFile({
        path: ref.path,
      });
      return {
        cloudFile,
        response,
        operation: "download",
      };
    }

    const { content } = options;

    // check if file still exists
    const cloudFile = await getFileMetaData({
      path: ref.path,
    }).catch((error) => {
      if (error instanceof CloudStorageError && error.type !== "Not Found") {
        throw error;
      }
      return undefined;
    });

    // upload file if it does not exist anymore
    if (!cloudFile) {
      const cloudFile = await uploadFile({
        overwrite: true,
        path: ref.path,
        content,
      });
      return {
        operation: "upload",
        cloudFile,
      };
    }

    const checksum = await createChecksum(content);
    const sameContent = checksum === ref.checksum;
    const refLastModified = parseDate(ref.lastModified);
    const cloudLastModified = parseDate(cloudFile.lastModified);
    const sameDate = isDateEqual(refLastModified, cloudLastModified);
    const refDateBeforeCloudDate = isDateBefore(
      refLastModified,
      cloudLastModified
    );
    const refDateAfterCloudDate = isDateAfter(
      refLastModified,
      cloudLastModified
    );

    if (sameDate && sameContent) {
      // no sync needed
      return { operation: "none" };
    }

    // use the local content and upload to cloud
    if ((sameDate && !sameContent) || refDateAfterCloudDate) {
      const cloudFile = await uploadFile({
        overwrite: true,
        path: ref.path,
        content,
      });
      return {
        operation: "upload",
        cloudFile,
      };
    }

    // use cloud content and download to local
    if (refDateBeforeCloudDate) {
      const { response, cloudFile } = await downloadFile({
        path: ref.path,
      });
      return {
        operation: "download",
        cloudFile,
        response,
      };
    }

    // no sync needed
    return { operation: "none" };
  };
}
