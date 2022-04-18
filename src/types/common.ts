import { ReactNode } from "react";

export interface Dictionary<T> {
  [key: string]: T;
}

export interface WithChildren {
  children?: ReactNode;
}
