import { GetOptions, GetResult, SetOptions } from "@capacitor/storage";

export const Storage = {
  async get(options: GetOptions): Promise<GetResult> {
    return { value: null };
  },
  async set(options: SetOptions): Promise<void> {},
};
