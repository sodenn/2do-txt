import {
  request,
  RequestContext,
  RequestOptions,
} from "../../../utils/request";
import { encodePath } from "./path";
import { handleResponseCode } from "./response";
import { BufferLike, ResponseDataDetailed } from "./types";
import { joinURL } from "./url";

export async function getFileContents(
  context: RequestContext,
  filePath: string,
  format: "binary" | "text" = "binary"
): Promise<BufferLike | string | ResponseDataDetailed<BufferLike | string>> {
  if (format !== "binary" && format !== "text") {
    throw new Error(`Invalid output format: ${format}`);
  }
  return format === "text"
    ? getFileContentsString(context, filePath)
    : getFileContentsBuffer(context, filePath);
}

async function getFileContentsBuffer(
  context: RequestContext,
  filePath: string
): Promise<BufferLike | ResponseDataDetailed<BufferLike>> {
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
): Promise<string | ResponseDataDetailed<string>> {
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
