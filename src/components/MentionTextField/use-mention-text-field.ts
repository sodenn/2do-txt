import { useCallback, useMemo } from "react";
import { createEditor, Editor, Element, Range, Transforms } from "slate";
import { withHistory } from "slate-history";
import { ReactEditor, withReact } from "slate-react";
import {
  InsertAction,
  InsertMentionHookOptions,
  MentionElement,
  MentionTextFieldHookOptions,
  MentionTextFieldState,
} from "./mention-types";
import { escapeRegExp, focusEditor, isMentionElement } from "./mention-utils";

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

export function useMentionTextField(opt: MentionTextFieldHookOptions) {
  const { mentions, singleLine } = opt;

  const editor = useMemo(
    () => withMentions(withReact(withHistory(createEditor()))),
    []
  );

  const state: MentionTextFieldState = { editor, mentions, singleLine };

  const getInsertAction = useCallback((): InsertAction | undefined => {
    const { selection } = editor;
    if (selection && Range.isCollapsed(selection)) {
      const [start] = Range.edges(selection);
      const prev = Editor.previous(editor);
      const next = Editor.next(editor);

      if (prev && isMentionElement(prev[0])) {
        return { action: "insert-space", direction: "before" };
      }

      if (next && isMentionElement(next[0])) {
        return { action: "insert-space", direction: "after" };
      }

      const charBefore = Editor.before(editor, start, { unit: "character" });
      const beforeRange = charBefore && Editor.range(editor, charBefore, start);
      const beforeText = beforeRange && Editor.string(editor, beforeRange);

      const charAfter = Editor.after(editor, start, { unit: "character" });
      const afterRange = charAfter && Editor.range(editor, charAfter, start);
      const afterText = afterRange && Editor.string(editor, afterRange);

      const triggers = mentions
        .map((m) => escapeRegExp(m.trigger))
        .filter((t) => t.length === 1)
        .join("");
      const pattern = `[^\\s${triggers}]`;
      const regex = new RegExp(pattern);

      if (
        beforeText &&
        regex.test(beforeText) &&
        (!afterText || afterText === " ")
      ) {
        return { action: "insert-space", direction: "before" };
      }

      if (
        (!beforeText || beforeText === " ") &&
        afterText &&
        regex.test(afterText)
      ) {
        return { action: "insert-space", direction: "after" };
      }

      if (
        (!beforeText || beforeText === " ") &&
        (!afterText || afterText === " ")
      ) {
        return { action: "insert-node" };
      }
    }
  }, [editor, mentions]);

  const openSuggestions = useCallback(
    (trigger: string) => {
      focusEditor(editor);
      const action = getInsertAction();
      if (action) {
        if (action.action === "insert-space" && action.direction === "before") {
          Editor.insertText(editor, ` ${trigger}`);
          return;
        }

        if (action.action === "insert-space" && action.direction === "after") {
          Editor.insertText(editor, `${trigger} `);
          Transforms.move(editor, {
            distance: 1,
            unit: "character",
            reverse: true,
          });
          return;
        }

        if (action.action === "insert-node") {
          Editor.insertText(editor, trigger);
          return;
        }
      }
    },
    [editor, getInsertAction]
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

      focusEditor(editor);

      const action = getInsertAction();

      if (!action) {
        return;
      }

      if (action.action === "insert-space" && action.direction === "before") {
        Editor.insertText(editor, " ");
        Transforms.move(editor);
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

      if (action.action === "insert-space" && action.direction === "after") {
        Editor.insertText(editor, " ");
        Transforms.move(editor);
      }
    },
    [editor, getInsertAction, mentions, removeMention]
  );

  return {
    state,
    openSuggestions,
    insertMention,
    removeMention,
  };
}
