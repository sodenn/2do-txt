import { ReactNode } from "react";

export interface WithChildren {
  children?: ReactNode;
}

export type DeepRequired<T> = {
  [P in keyof T]-?: NonNullable<Required<T>[P]> extends object
    ? DeepRequired<NonNullable<Required<T>[P]>>
    : NonNullable<Required<T>[P]>;
};
