import { useCallback, useEffect, useState } from "react";
import {
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { CloudArchiveFileRef } from "../../types/cloud-storage.types";
import { createContext } from "../../utils/Context";
import { getPlatform } from "../../utils/platform";
import {
  getPreferencesItem,
  setPreferencesItem,
} from "../../utils/preferences";
import { LoaderData } from "../loader";
import * as cloud from "./cloud-storage";
import { CloudFileRef, CloudStorage } from "./cloud-storage.types";

const platform = getPlatform();

const [CloudStorageProvider, useCloudStorage] = createContext(() => {
  const data = useLoaderData() as LoaderData;
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [connectedCloudStorages, setConnectedCloudStorages] = useState(
    data.connectedCloudStorages
  );

  const authenticate = useCallback(async (cloudStorage: CloudStorage) => {
    await cloud.authenticate(cloudStorage);
    // Note: web platform goes a different way because a redirect is used
    if (["ios", "android", "electron"].includes(platform)) {
      setConnectedCloudStorages((current) => ({
        ...current,
        [cloudStorage]: true,
      }));
    }
  }, []);

  const getCloudFileRefs = useCallback(async (): Promise<CloudFileRef[]> => {
    const cloudFilesStr = await getPreferencesItem("cloud-files");
    try {
      return cloudFilesStr ? JSON.parse(cloudFilesStr) : [];
    } catch (error) {
      await setPreferencesItem("cloud-files", JSON.stringify([]));
      return [];
    }
  }, []);

  const getCloudArchiveFileRefs = useCallback(async (): Promise<
    CloudArchiveFileRef[]
  > => {
    const cloudArchiveFilesStr = await getPreferencesItem(
      "cloud-archive-files"
    );
    try {
      return cloudArchiveFilesStr ? JSON.parse(cloudArchiveFilesStr) : [];
    } catch (error) {
      await setPreferencesItem("cloud-archive-files", JSON.stringify([]));
      return [];
    }
  }, []);

  useEffect(() => {
    const code = searchParams.get("code");
    const pathname = location.pathname;
    if (code && pathname === "/dropbox") {
      navigate("/", { replace: true });
      // requestTokens({ cloudStorage: "Dropbox", authorizationCode: code });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
});
