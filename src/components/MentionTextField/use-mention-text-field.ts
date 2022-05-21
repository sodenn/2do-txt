import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BaseRange,
  createEditor,
  Editor,
  Element,
  Range,
  Text,
  Transforms,
} from "slate";
import { withHistory } from "slate-history";
import { withReact } from "slate-react";
import {
  InsertAction,
  InsertMentionHookOptions,
  MentionElement,
  MentionTextFieldHookOptions,
  MentionTextFieldState,
  RemoveOrReplaceMentionsOptions,
} from "./mention-types";
import {
  escapeRegExp,
  focusEditor,
  isMentionElement,
  zeroWidthChars,
} from "./mention-utils";

function withMentions(editor: Editor) {
  const { isInline, isVoid, normalizeNode } = editor;

  editor.isInline = (element) => {
    return element.type === "mention" ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === "mention" ? true : isVoid(element);
  };

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;
    const prevEntry = Editor.previous(editor, { at: path });
    const nextEntry = Editor.next(editor, { at: path });

    const textAfterMention =
      prevEntry &&
      isMentionElement(prevEntry[0]) &&
      Text.isText(node) &&
      new RegExp(`^\\S|^${zeroWidthChars}\\S`).test(node.text);

    if (textAfterMention) {
      Transforms.insertNodes(editor, { text: " " }, { at: path });
      return true;
    }

    const mentionAfterText =
      nextEntry &&
      isMentionElement(nextEntry[0]) &&
      Text.isText(node) &&
      /\S$/.test(node.text);

    if (mentionAfterText) {
      Transforms.insertNodes(editor, { text: " " }, { at: nextEntry[1] });
      return true;
    }

    normalizeNode(entry);
  };

  return editor;
}

export function useMentionTextField(opt: MentionTextFieldHookOptions) {
  const { mentions, singleLine } = opt;

  const editor = useMemo(
    () => withMentions(withReact(withHistory(createEditor()))),
    []
  );

  const [selection, setSelection] = useState<BaseRange | undefined>();

  const state: MentionTextFieldState = { editor, mentions, singleLine };

  const getInsertAction = useCallback((): InsertAction | undefined => {
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
  }, [editor, mentions, selection]);

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

  const findMentionEntries = useCallback(
    (trigger: string, value?: string) => {
      return Array.from(
        Editor.nodes(editor, {
          at: [],
          match: (n) =>
            !Editor.isEditor(n) && Element.isElement(n) && isMentionElement(n),
        })
      ).filter((entry) => {
        const [node] = entry;
        return (
          isMentionElement(node) &&
          node.trigger === trigger &&
          (!value || value === node.value)
        );
      });
    },
    [editor]
  );

  const removeOrReplaceMentions = useCallback(
    (opt: RemoveOrReplaceMentionsOptions) => {
      const { trigger, value, newValue } = opt;

      const mentionEntries = findMentionEntries(trigger, value);

      mentionEntries.forEach((entry) => {
        const [, path] = entry;

        const prev = Editor.previous(editor, { at: path });

        // remove space at the end of the previous text node
        if (!newValue && prev) {
          const [prevNode, prevPath] = prev;
          if (Text.isText(prevNode) && prevNode.text.endsWith(" ")) {
            Transforms.removeNodes(editor, { at: prevPath });
            Transforms.insertNodes(
              editor,
              { text: prevNode.text.trim() },
              { at: prevPath }
            );
          }
        }

        // replace or remove the mention
        if (newValue) {
          Transforms.setNodes(editor, { value: newValue }, { at: path });
        } else {
          Transforms.removeNodes(editor, { at: path });
          if (prev) {
            const [, prevPath] = prev;
            Transforms.select(editor, {
              anchor: Editor.start(editor, prevPath),
              focus: Editor.end(editor, prevPath),
            });
          } else {
            Transforms.select(editor, {
              anchor: Editor.start(editor, []),
              focus: Editor.end(editor, []),
            });
          }
        }
      });
    },
    [editor, findMentionEntries]
  );

  const removeMentions = useCallback(
    (trigger: string, value?: string) => {
      removeOrReplaceMentions({ trigger, value });
    },
    [removeOrReplaceMentions]
  );

  const replaceMentions = useCallback(
    (trigger: string, value: string) => {
      removeOrReplaceMentions({
        trigger,
        newValue: value,
      });
    },
    [removeOrReplaceMentions]
  );

  const insertMention = useCallback(
    (opt: InsertMentionHookOptions) => {
      const { value, trigger, replace } = opt;

      if (replace && findMentionEntries(opt.trigger).length > 0) {
        replaceMentions(opt.trigger, opt.value);
        return;
      }

      // restore selection if lost by popover or similar
      if (!editor.selection && selection) {
        Transforms.select(editor, selection);
      }

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
    [
      editor,
      findMentionEntries,
      getInsertAction,
      mentions,
      replaceMentions,
      selection,
    ]
  );

  useEffect(() => {
    // store the last non-null selection for possible restore
    if (editor.selection) {
      setSelection(editor.selection);
    }
  }, [editor.selection]);

  return {
    state,
    openSuggestions,
    removeMentions,
    replaceMentions,
    insertMention,
  };
}
