import { PropsWithChildren } from "react";

export function Kbd({ children }: PropsWithChildren) {
  return (
    <kbd className="pointer-events-none items-center gap-1 rounded border px-1.5 ml-1.5 font-mono font-medium sm:inline-flex opacity-80 [@media(pointer:coarse)]:hidden">
      {children}
    </kbd>
  );
}
