import { CSSProperties, FunctionComponent, ReactNode } from "react";
import { BaseEditor, BaseRange, Descendant, Editor } from "slate";
import { HistoryEditor } from "slate-history";
import { ReactEditor } from "slate-react";
import { WithChildren } from "../../types/common";

interface MentionTextFieldState {
  editor: Editor;
  mentions: Mention[];
  singleLine?: boolean;
}

interface MentionTextFieldProps
  extends Omit<React.TextareaHTMLAttributes<HTMLDivElement>, "onChange"> {
  state: MentionTextFieldState;
  autoFocus?: boolean;
  placeholder?: string;
  initialValue?: string;
  onChange?: (value: string) => void;
  addMentionText?: (value: string) => ReactNode;
  onEnterPress?: () => void;
  suggestionPopoverZIndex?: number;
  suggestionListComponent?: FunctionComponent;
  suggestionListItemComponent?: FunctionComponent<SuggestionListItemProps>;
}

interface MentionTextFieldHookOptions {
  mentions: Mention[];
  singleLine?: boolean;
}

interface SuggestionListItemProps extends WithChildren {
  onClick: () => void;
  selected: boolean;
}

interface Mention {
  trigger: string;
  suggestions: string[];
  style?: CSSProperties;
}

interface RemoveOrReplaceMentionsOptions {
  trigger: string;
  value?: string;
  newValue?: string;
}

interface InsertMentionHookOptions extends Omit<Mention, "suggestions"> {
  value: string;
  replace: boolean;
}

interface InsertMentionOptions extends Omit<Mention, "suggestions"> {
  editor: Editor;
  value: string;
  target: BaseRange;
}

interface InsertSpaceAction {
  action: "insert-space";
  direction: "before" | "after";
}

interface InsertNodeAction {
  action: "insert-node";
}

export type InsertAction = InsertSpaceAction | InsertNodeAction;

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
  MentionTextFieldState,
  MentionTextFieldProps,
  MentionTextFieldHookOptions,
  SuggestionListItemProps,
  Mention,
  Suggestion,
  CustomEditor,
  CustomText,
  RemoveOrReplaceMentionsOptions,
  InsertMentionOptions,
  InsertMentionHookOptions,
  ParagraphElement,
};
