import { css } from "@emotion/css";

export const taskProjectStyle = css`
  color: #175fab;
  background-color: #c4dcf7;
`;

export const taskContextStyle = css`
  color: #17501b;
  background-color: #c8efcb;
`;

export const taskDudDateStyle = css`
  color: #a14205;
  background-color: #fddac3;
  white-space: nowrap;
`;

export const taskTagStyle = css`
  color: #4b4b4b;
  background-color: #dfdfdf;
  white-space: nowrap;
`;

export const taskPriorityStyle = css`
  color: #720daf;
  background-color: #ecd2fb;
  font-weight: bold;
`;

export const taskDateStyle = css`
  opacity: 0.5;
  font-size: 0.75em;
`;

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

export const taskCompletedStyle = css`
  text-decoration: line-through;
`;

export const taskDisabledStyle = css`
  opacity: 0.6;
`;
