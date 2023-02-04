import { request, RequestContext } from "../../../utils/request";
import { encodePath } from "./path";
import { handleResponseCode } from "./response";

export async function deleteFile(
  context: RequestContext,
  filename: string
): Promise<void> {
  const opt = {
    path: encodePath(filename),
    method: "DELETE",
    context,
  };
  const response = await request(opt);
  handleResponseCode(response);
}
