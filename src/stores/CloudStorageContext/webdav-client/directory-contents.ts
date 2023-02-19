import {
  joinURL,
  request,
  RequestContext,
  RequestOptions,
} from "../../../utils/network";
import { parseXML, prepareFileFromProps } from "./dav";
import { encodePath, normalisePath, relative } from "./path";
import { handleResponseCode } from "./response";
import { DAVResult, FileStat } from "./types";
import { extractURLPath, normaliseHREF } from "./url";

export async function getDirectoryContents(
  context: RequestContext,
  path: string
): Promise<Array<FileStat>> {
  const requestOptions: RequestOptions = {
    path: joinURL(encodePath(path), "/"),
    method: "PROPFIND",
    headers: {
      Accept: "text/plain,application/xml",
      Depth: "1",
    },
    responseType: "text",
    context,
  };
  const response = await request(requestOptions);
  handleResponseCode(response);
  const responseData = await response.text();
  if (!responseData) {
    throw new Error("Failed parsing directory contents: Empty response");
  }
  const davResp = await parseXML(responseData);
  const _remotePath = path.startsWith("/") ? path : "/" + path;
  const serverBasePath = extractURLPath(context.baseUrl);
  return getDirectoryFiles(davResp, serverBasePath, _remotePath);
}

function getDirectoryFiles(
  result: DAVResult,
  serverBasePath: string,
  requestPath: string
): Array<FileStat> {
  const serverBase = joinURL(serverBasePath, "/");
  // Extract the response items (directory contents)
  const {
    multistatus: { response: responseItems },
  } = result;
  return (
    responseItems
      // Map all items to a consistent output structure (results)
      .map((item) => {
        // HREF is the file path (in full)
        const href = normaliseHREF(item.href);
        // Each item should contain a stat object
        const {
          propstat: { prop: props },
        } = item;
        // Process the true full filename (minus the base server path)
        const filename =
          serverBase === "/"
            ? decodeURIComponent(normalisePath(href))
            : decodeURIComponent(normalisePath(relative(serverBase, href)));
        return prepareFileFromProps(props, filename);
      })
      // Filter out the item pointing to the current directory (not needed)
      .filter(
        (item) =>
          item.basename &&
          (item.type === "file" ||
            item.filename !== requestPath.replace(/\/$/, ""))
      )
  );
}
