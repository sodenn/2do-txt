import { PropsWithChildren } from "react";

export function Kbd({ children }: PropsWithChildren) {
  return (
    <kbd className="pointer-events-none ml-1.5 items-center gap-1 rounded border px-1.5 font-mono font-medium opacity-80 sm:inline-flex [@media(pointer:coarse)]:hidden">
      {children}
    </kbd>
  );
}
