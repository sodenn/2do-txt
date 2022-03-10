import {
  GetOptions,
  GetResult,
  RemoveOptions,
  SetOptions,
} from "@capacitor/storage";

export const Storage = {
  async get(options: GetOptions): Promise<GetResult> {
    return { value: null };
  },
  async set(options: SetOptions): Promise<void> {},
  async remove(options: RemoveOptions): Promise<void> {},
};
