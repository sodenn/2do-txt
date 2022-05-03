declare namespace ImportMeta {
  interface ImportMetaEnv {
    NODE_ENV: "development" | "production" | "test";
    VITE_DROPBOX_CLIENT_ID: string;
    VITE_WEB_CLOUD_STORAGE_ENABLE: "true" | "false";
    VITE_DEFAULT_FILE_NAME: string;
    VITE_ARCHIVE_FILE_NAME: string;
  }
}
