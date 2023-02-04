import { XMLParser } from "fast-xml-parser";
import { get, set } from "lodash";
import { decodeHTMLEntities } from "./encode";
import { basename } from "./path";
import {
  DAVResult,
  DAVResultRaw,
  DAVResultResponse,
  DAVResultResponseProps,
  FileStat,
} from "./types";

enum PropertyType {
  Array = "array",
  Object = "object",
  Original = "original",
}

function getPropertyOfType(
  obj: object,
  prop: string,
  type: PropertyType = PropertyType.Original
): any {
  const val = get(obj, prop);
  if (type === "array" && Array.isArray(val) === false) {
    return [val];
  } else if (type === "object" && Array.isArray(val)) {
    return val[0];
  }
  return val;
}

function normaliseResponse(response: any): DAVResultResponse {
  const output = Object.assign({}, response);
  set(
    output,
    "propstat",
    getPropertyOfType(output, "propstat", PropertyType.Object)
  );
  set(
    output,
    "propstat.prop",
    getPropertyOfType(output, "propstat.prop", PropertyType.Object)
  );
  return output;
}

function normaliseResult(result: DAVResultRaw): DAVResult {
  const { multistatus } = result;
  if (multistatus === "") {
    return {
      multistatus: {
        response: [],
      },
    };
  }
  if (!multistatus) {
    throw new Error("Invalid response: No root multistatus found");
  }
  const output: any = {
    multistatus: Array.isArray(multistatus) ? multistatus[0] : multistatus,
  };
  set(
    output,
    "multistatus.response",
    getPropertyOfType(output, "multistatus.response", PropertyType.Array)
  );
  set(
    output,
    "multistatus.response",
    get<any, any>(output, "multistatus.response").map((response: any) =>
      normaliseResponse(response)
    )
  );
  return output as DAVResult;
}

export function parseXML(xml: string): Promise<DAVResult> {
  return new Promise((resolve) => {
    const parser = new XMLParser({
      isArray: () => false,
      removeNSPrefix: true,
    });
    const result = parser.parse(xml);
    resolve(normaliseResult(result));
  });
}

export function prepareFileFromProps(
  props: DAVResultResponseProps,
  rawFilename: string
): FileStat {
  // Last modified time, raw size, item type and mime
  const {
    getlastmodified: lastMod = null,
    getcontentlength: rawSize = "0",
    resourcetype: resourceType = null,
    getcontenttype: mimeType = null,
    getetag: etag = null,
  } = props;
  const type =
    resourceType &&
    typeof resourceType === "object" &&
    typeof resourceType.collection !== "undefined"
      ? "directory"
      : "file";
  const filename = decodeHTMLEntities(rawFilename);
  const stat: FileStat = {
    filename,
    basename: basename(filename),
    lastmod: lastMod!,
    size: parseInt(rawSize, 10),
    type,
    etag: typeof etag === "string" ? etag.replace(/"/g, "") : null,
  };
  if (type === "file") {
    stat.mime =
      mimeType && typeof mimeType === "string" ? mimeType.split(";")[0] : "";
  }
  return stat;
}
