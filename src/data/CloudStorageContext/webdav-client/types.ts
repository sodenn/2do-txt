export enum AuthType {
  Digest = "digest",
  None = "none",
  Password = "password",
  Token = "token",
}

export type BufferLike = Buffer | ArrayBuffer;

export interface DAVResultResponse {
  href: string;
  propstat: {
    prop: DAVResultResponseProps;
    status: string;
  };
}

export interface DAVResultResponseProps {
  displayname: string;
  resourcetype: {
    collection?: boolean;
  };
  getlastmodified?: string;
  getetag?: string;
  getcontentlength?: string;
  getcontenttype?: string;
  "quota-available-bytes"?: any;
  "quota-used-bytes"?: string;
}

export interface DAVResult {
  multistatus: {
    response: Array<DAVResultResponse>;
  };
}

export interface DAVResultRawMultistatus {
  response: DAVResultResponse | [DAVResultResponse];
}

export interface DAVResultRaw {
  multistatus: "" | DAVResultRawMultistatus | [DAVResultRawMultistatus];
}

export enum ErrorCode {
  DataTypeNoLength = "data-type-no-length",
  InvalidAuthType = "invalid-auth-type",
  InvalidOutputFormat = "invalid-output-format",
  LinkUnsupportedAuthType = "link-unsupported-auth",
}

export interface FileStat {
  filename: string;
  basename: string;
  lastmod: string;
  size: number;
  type: "file" | "directory";
  etag: string | null;
  mime?: string;
  props?: DAVResultResponseProps;
}

export interface Headers {
  [key: string]: string;
}

export interface WebDAVClient {
  deleteFile: (filename: string) => Promise<void>;
  getDirectoryContents: (path: string) => Promise<Array<FileStat>>;
  getFileContents: (
    filename: string,
    format: "binary" | "text"
  ) => Promise<BufferLike | string>;
  putFileContents: (
    filename: string,
    data: string | BufferLike | any
  ) => Promise<boolean>;
}

export class WebDAVClientError extends Error {
  constructor(public message: string, public status: number) {
    super();
  }
}
