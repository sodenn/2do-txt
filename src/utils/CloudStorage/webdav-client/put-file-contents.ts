import {
  request,
  RequestContext,
  RequestOptions,
} from "../../../native-api/network";
import { encodePath } from "./path";
import { handleResponseCode } from "./response";
import { calculateDataLength } from "./size";
import { BufferLike, Headers } from "./types";

export async function putFileContents(
  context: RequestContext,
  filePath: string,
  data: string | BufferLike
): Promise<boolean> {
  const headers: Headers = {
    "Content-Type": "application/octet-stream",
    "Content-Length": `${calculateDataLength(data as string | BufferLike)}`,
  };
  const opt: RequestOptions = {
    path: encodePath(filePath),
    responseType: "binary",
    method: "PUT",
    headers,
    context,
    data,
  };
  const response = await request(opt);
  handleResponseCode(response);
  return true;
}
