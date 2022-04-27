import React, { CSSProperties, FunctionComponent } from "react";
import { BaseEditor, BaseRange, Descendant, Editor } from "slate";
import { HistoryEditor } from "slate-history";
import { ReactEditor } from "slate-react";

interface MentionTextFieldProps
  extends Omit<React.TextareaHTMLAttributes<HTMLDivElement>, "onChange"> {
  editor: Editor;
  triggers: Trigger[];
  autoFocus?: boolean;
  placeholder?: string;
  initialValue?: string;
  suggestions?: Suggestion[];
  onChange?: (value: string) => void;
  addMentionText?: (value: string) => string;
  onEnterPress?: () => void;
  suggestionListComponent?: FunctionComponent;
  suggestionListItemComponent?: FunctionComponent<SuggestionListItemProps>;
}

interface SuggestionListItemProps {
  onClick: () => void;
  selected: boolean;
}

interface Trigger {
  value: string;
  style?: CSSProperties;
}

interface Suggestion {
  trigger: string;
  items: string[];
}

interface Mention {
  trigger: string;
  value: string;
}

interface InsertMentionOptions {
  editor: Editor;
  value: string;
  trigger: Trigger;
  target: BaseRange;
}

export interface MentionElement {
  type: "mention";
  value: string;
  trigger: string;
  style?: CSSProperties;
  children: CustomText[];
}

interface ParagraphElement {
  type: "paragraph";
  align?: string;
  children: Descendant[];
}

interface CustomText {
  text: string;
}

type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

declare module "slate" {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: MentionElement | ParagraphElement;
    Text: CustomText;
  }
}

export {
  MentionTextFieldProps,
  SuggestionListItemProps,
  Trigger,
  Mention,
  Suggestion,
  CustomEditor,
  CustomText,
  InsertMentionOptions,
  ParagraphElement,
};
