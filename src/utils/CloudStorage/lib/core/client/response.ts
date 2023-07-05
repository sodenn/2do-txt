import { CloudError } from "../errors";

export async function handleResponseErrors(
  response: Response,
): Promise<Response> {
  const { status, text } = response;
  if (status === 401) {
    throw new CloudError({ type: "Unauthorized" });
  }
  if (status === 404) {
    const cause = await text();
    throw new CloudError({ type: "Not Found", cause });
  }
  if (status === 409) {
    const cause = await text();
    throw new CloudError({ type: "Conflict", cause });
  }
  if (status >= 400) {
    const cause = await text();
    throw new CloudError({ cause });
  }
  return response;
}
