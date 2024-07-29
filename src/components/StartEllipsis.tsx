import { HTMLAttributes } from "react";

export function StartEllipsis(props: HTMLAttributes<HTMLDivElement>) {
  const { children, ...rest } = props;
  return (
    <div style={{ direction: "rtl" }} className="truncate text-left" {...rest}>
      <span style={{ unicodeBidi: "plaintext" }}>{children}</span>
    </div>
  );
}
