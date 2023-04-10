import { Provider, WithPath, WithProvider } from "../types";

type CloudStorageErrorType = "Conflict" | "Not Found" | "Unauthorized";

interface CloudErrorOptions {
  type?: CloudStorageErrorType;
  cause?: any;
}

type CloudStorageErrorOptions = CloudErrorOptions &
  Partial<WithPath> &
  WithProvider;

export class CloudError extends Error {
  type?: CloudStorageErrorType;
  constructor(opt: CloudErrorOptions = {}) {
    const { type, cause } = opt;
    const message = cause && cause instanceof Error ? cause.message : cause;
    super(message);
    this.type = type;
  }
}

export class CloudStorageError extends CloudError {
  path?: string;
  provider: Provider;
  constructor(opt: CloudStorageErrorOptions) {
    const { path, provider } = opt;
    super(opt);
    this.path = path;
    this.provider = provider;
  }
}
