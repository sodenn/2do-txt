import { css } from "@emotion/css";

export const taskProjectStyle = css`
  color: #1970c9;
  background-color: #d5e6fc;
`;

export const taskContextStyle = css`
  color: #1b5e20;
  background-color: #d1dfd2;
`;

export const taskFieldStyle = css`
  color: #b44a05;
  background-color: #ffdac2;
`;

export const taskPriorityStyle = css`
  color: #720daf;
  background-color: #c3b5c5;
  font-weight: bold;
`;

export const taskDateStyle = css`
  color: #00000099;
  background-color: rgba(235, 235, 235, 0.6);
`;

export const taskTagStyle = css`
  hyphens: none;
  display: inline;
  margin-top: 2px;
  margin-bottom: 2px;
  padding: 1px 0;
  border-radius: 4px;
  white-space: nowrap;
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
  opacity: 0.5;
`;

export const taskSmallStyle = css`
  font-size: 0.75em;
  padding: 1px 0 0 0;
`;
