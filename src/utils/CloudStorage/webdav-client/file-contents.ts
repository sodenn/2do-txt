import {
  joinURL,
  request,
  RequestContext,
  RequestOptions,
} from "../../../native-api/network";
import { encodePath } from "./path";
import { handleResponseCode } from "./response";
import { BufferLike } from "./types";

export async function getFileContents(
  context: RequestContext,
  filePath: string,
  format: "binary" | "text" = "binary"
): Promise<BufferLike | string> {
  return format === "text"
    ? getFileContentsString(context, filePath)
    : getFileContentsBuffer(context, filePath);
}

async function getFileContentsBuffer(
  context: RequestContext,
  filePath: string
): Promise<BufferLike> {
  const opt: RequestOptions = {
    responseType: "binary",
    path: joinURL(encodePath(filePath)),
    method: "GET",
    context,
  };
  const response = await request(opt);
  handleResponseCode(response);
  return response.arrayBuffer();
}

async function getFileContentsString(
  context: RequestContext,
  filePath: string
): Promise<string> {
  const opt: RequestOptions = {
    responseType: "text",
    path: joinURL(encodePath(filePath)),
    method: "GET",
    headers: {
      Accept: "text/plain",
    },
    context,
  };
  const response = await request(opt);
  handleResponseCode(response);
  return response.text();
}
