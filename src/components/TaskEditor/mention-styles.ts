import { css } from "@emotion/css";

export const mentionClassStyle = css`
  border-radius: 4px;
  padding: 0.1em 0.2em;
  text-decoration: none;
  white-space: nowrap;
`;

export const mentionStyles = css`
  position: absolute;
  min-width: 16px;
  min-height: 16px;
  max-width: calc(100% - 32px);
  max-height: calc(100% - 32px);
  border-radius: 4px;
  box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
    0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);
  padding: 8px 0;
  z-index: 2;
`;

export const mentionSuggestionsLightStyle = css`
  color: rgba(0, 0, 0, 0.87);
  background-color: rgb(255, 255, 255);
`;

export const mentionSuggestionsDarkStyle = css`
  color: rgb(255, 255, 255);
  background-color: #0a1726;
  background-image: linear-gradient(
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.05)
  );
`;

export const mentionSuggestionsEntryContainerStyle = css`
  padding: 6px 16px;
`;

export const mentionSuggestionsEntryStyle = css`
  padding: 6px 16px;
  &:active {
    background-color: rgba(0, 0, 0, 0.04);
  }
`;

export const mentionSuggestionsEntryFocusedStyle = css`
  composes: ${mentionSuggestionsEntryStyle};
  padding: 6px 16px;
  cursor: pointer;
`;

export const mentionSuggestionsEntryFocusedLightStyle = css`
  background-color: rgba(0, 0, 0, 0.04);
`;

export const mentionSuggestionsEntryFocusedDarkStyle = css`
  background-color: rgba(255, 255, 255, 0.08);
`;

export const mentionSuggestionsEntryTextStyle = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const mentionSuggestionsEntryTextLightStyle = css`
  color: black;
`;

export const mentionSuggestionsEntryTextDarkStyle = css`
  color: rgb(255, 255, 255);
`;
