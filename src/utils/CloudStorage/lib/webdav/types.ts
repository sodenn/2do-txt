export type BufferLike = Buffer | ArrayBuffer;

export interface DAVResultResponse {
  href: string;
  propstat: {
    prop: DAVResultResponseProps;
  };
}

export interface DAVResultResponseProps {
  resourcetype: {
    collection?: boolean;
  };
  getlastmodified?: string;
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

export interface Headers {
  [key: string]: string;
}

export interface WebDAVClientOptions {
  fetch?: typeof fetch;
  baseUrl: string;
  basicAuth: {
    username: string;
    password: string;
  };
}
