import { CloudFileRef, Provider, WithIdentifier } from "../types";

export interface CloudPreferencesStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface CloudPreferencesOptions {
  refsKey?: string;
  storage?: CloudPreferencesStorage;
}

export type GetRef = (
  identifier: string
) => Promise<CloudFileRef & WithIdentifier>;

export type GetRefs = () => Promise<(CloudFileRef & WithIdentifier)[]>;

export type SetRef = (identifier: string, ref: CloudFileRef) => Promise<void>;

export type RemoveRef = (identifier: string) => Promise<void>;

export type RemoveRefs = (provider: Provider) => Promise<void>;

export type GetProviders = () => Promise<Provider[]>;

export interface Preferences {
  getRef: GetRef;
  getRefs: GetRefs;
  setRef: SetRef;
  removeRef: RemoveRef;
  removeRefs: RemoveRefs;
  getProviders: GetProviders;
}
