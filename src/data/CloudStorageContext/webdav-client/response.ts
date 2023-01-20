import { Response } from "../../../utils/request";
import { WebDAVClientError } from "./types";

export function handleResponseCode(response: Response): Response {
  const { status } = response;
  if (status >= 400) {
    throw new WebDAVClientError(
      `Invalid response: ${response.status}`,
      response.status
    );
  }
  return response;
}
