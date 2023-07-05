import { XMLParser } from "fast-xml-parser";
import { CloudError, CloudItem } from "../core";
import { decodeHTMLEntities } from "./decode-html";
import { basename } from "./path";
import {
  DAVResult,
  DAVResultRaw,
  DAVResultResponse,
  DAVResultResponseProps,
} from "./types";

type PropertyType = "array" | "object" | "original";

function getPropertyOfType(val: any, type: PropertyType = "original"): any {
  if (type === "array" && !Array.isArray(val)) {
    return [val];
  } else if (type === "object" && Array.isArray(val)) {
    return val[0];
  }
  return val;
}

function normalizeResponse(response: any): DAVResultResponse {
  const output = { ...response };
  output.propstat = getPropertyOfType(output.propstat, "object");
  output.propstat.prop = getPropertyOfType(output.propstat?.prop, "object");
  return output;
}

function normalizeResult(result: DAVResultRaw): DAVResult {
  const { multistatus } = result;
  if (multistatus === "") {
    return {
      multistatus: {
        response: [],
      },
    };
  }
  if (!multistatus) {
    throw new CloudError({
      cause: "Invalid response: No root multistatus found",
    });
  }
  const output: any = {
    multistatus: Array.isArray(multistatus) ? multistatus[0] : multistatus,
  };
  output.multistatus.response = getPropertyOfType(
    output.multistatus?.response,
    "array",
  );
  output.multistatus.response =
    output.multistatus.response.map(normalizeResponse);
  return output;
}

export function parseXML(xml: string): Promise<DAVResult> {
  return new Promise((resolve) => {
    const parser = new XMLParser({
      isArray: () => false,
      removeNSPrefix: true,
    });
    const result = parser.parse(xml);
    resolve(normalizeResult(result));
  });
}

export function prepareFileFromProps(
  props: DAVResultResponseProps,
  rawFilename: string,
): CloudItem {
  // Last modified time, raw size, item type and mime
  const {
    getlastmodified: lastModified = null,
    resourcetype: resourceType = null,
  } = props;
  const type =
    resourceType &&
    typeof resourceType === "object" &&
    typeof resourceType.collection !== "undefined"
      ? "directory"
      : "file";
  const filename = decodeHTMLEntities(rawFilename);
  return {
    path: filename,
    name: basename(filename),
    lastModified: lastModified!,
    type,
  };
}
