import { css } from "@emotion/css";
import { CSSProperties } from "react";

export const contextStyle: CSSProperties = {
  color: "#17501b",
  backgroundColor: "#c8efcb",
};

export const projectStyle: CSSProperties = {
  color: "#175fab",
  backgroundColor: "#c4dcf7",
};

export const dueDateStyle: CSSProperties = {
  color: "#a14205",
  backgroundColor: "#fddac3",
  whiteSpace: "nowrap",
};

export const tagStyle: CSSProperties = {
  color: "#4b4b4b",
  backgroundColor: "#dfdfdf",
  whiteSpace: "nowrap",
};

export const priorityBoldStyle: CSSProperties = {
  color: "#720daf",
  backgroundColor: "#ecd2fb",
  fontWeight: "bold",
};

export const priorityStyle: CSSProperties = {
  color: "#720daf",
  backgroundColor: "#ecd2fb",
  whiteSpace: "nowrap",
};

export const dateStyle: CSSProperties = {
  opacity: 0.5,
  fontSize: "0.75em",
};

export const taskChipStyle = css`
  hyphens: none;
  display: inline;
  margin-top: 2px;
  margin-bottom: 2px;
  padding: 1px 0;
  border-radius: 4px;
  word-break: break-word;
  text-decoration: inherit;
  &:before,
  &:after {
    content: "\\00a0";
  }
`;
