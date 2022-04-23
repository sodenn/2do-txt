import { CSSProperties } from "react";
import { BaseEditor, BaseRange, Descendant, Editor } from "slate";
import { HistoryEditor } from "slate-history";
import { ReactEditor } from "slate-react";

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

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

declare module "slate" {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: MentionElement | ParagraphElement;
    Text: CustomText;
  }
}
