/// <reference types="react-scripts" />
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    PUBLIC_URL: string;
    REACT_APP_DROPBOX_CLIENT_ID: string;
    REACT_APP_WEB_CLOUD_STORAGE_ENABLE: "true" | "false";
    REACT_APP_DEFAULT_FILE_NAME: string;
    REACT_APP_ARCHIVAL_FILE_NAME: string;
  }
}
