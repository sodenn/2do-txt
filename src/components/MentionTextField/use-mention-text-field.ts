import { useCallback, useMemo } from "react";
import { createEditor, Editor, Element, Range, Text, Transforms } from "slate";
import { withHistory } from "slate-history";
import { ReactEditor, withReact } from "slate-react";
import {
  InsertMentionHookOptions,
  Mention,
  MentionElement,
  MentionTextFieldState,
} from "./mention-types";
import { isMentionElement } from "./mention-utils";

function withMentions(editor: Editor) {
  const { isInline, isVoid } = editor;

  editor.isInline = (element) => {
    return element.type === "mention" ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === "mention" ? true : isVoid(element);
  };

  return editor;
}

export function useMentionTextField(mentions: Mention[]) {
  const editor = useMemo(
    () => withMentions(withReact(withHistory(createEditor()))),
    []
  );

  const state: MentionTextFieldState = { editor, mentions };

  const openSuggestions = useCallback(
    (trigger: string) => {
      ReactEditor.focus(editor);
      const { selection } = editor;
      if (selection && Range.isCollapsed(selection)) {
        const [start] = Range.edges(selection);
        const before = Editor.before(editor, start);
        if (before) {
          const [node] = Editor.node(editor, before);
          if (
            isMentionElement(node) ||
            (Text.isText(node) && !node.text.endsWith(" "))
          ) {
            Editor.insertText(editor, ` ${trigger}`);
          } else {
            Editor.insertText(editor, trigger);
          }
        } else {
          Editor.insertText(editor, trigger);
        }
      }
    },
    [editor]
  );

  const removeMention = useCallback(
    (trigger: string, value?: string) => {
      const mentionElements = Array.from(
        Editor.nodes(editor, {
          at: [],
          match: (n) =>
            !Editor.isEditor(n) && Element.isElement(n) && isMentionElement(n),
        })
      );
      mentionElements.forEach((node) => {
        const [element] = node;
        if (
          isMentionElement(element) &&
          element.trigger === trigger &&
          (!value || value === element.value)
        ) {
          const path = ReactEditor.findPath(editor, element);
          Transforms.removeNodes(editor, { at: path });
        }
      });
    },
    [editor]
  );

  const insertMention = useCallback(
    (opt: InsertMentionHookOptions) => {
      const { value, trigger, unique } = opt;

      if (unique) {
        removeMention(trigger);
      }

      const style = mentions.find((m) => m.trigger === trigger)?.style;

      const mentionElement: MentionElement = {
        type: "mention",
        trigger,
        style,
        value,
        children: [{ text: "" }],
      };

      Transforms.insertNodes(editor, mentionElement);
      Transforms.move(editor);
    },
    [editor, mentions, removeMention]
  );

  return {
    state,
    openSuggestions,
    insertMention,
    removeMention,
  };
}
