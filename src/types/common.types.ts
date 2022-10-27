import { ReactNode } from "react";

export interface WithChildren {
  children?: ReactNode;
}

export type WithOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
