import { useCallback, useMemo } from "react";
import {
  BaseRange,
  createEditor,
  Descendant,
  Editor,
  Element,
  Range,
  Text,
  Transforms,
} from "slate";
import { withHistory } from "slate-history";
import { ReactEditor, withReact } from "slate-react";
import {
  CustomText,
  InsertMentionOptions,
  MentionElement,
  ParagraphElement,
  Suggestion,
  Trigger,
} from "./mention-types";

export function useMentionTextField() {
  const editor = useMemo(
    () => withMentions(withReact(withHistory(createEditor()))),
    []
  );

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
    (trigger: Trigger, value: string, uniqueTrigger = false) => {
      if (uniqueTrigger) {
        removeMention(trigger.value);
      }

      const mentionElement: MentionElement = {
        type: "mention",
        trigger: trigger.value,
        style: trigger.style,
        value,
        children: [{ text: "" }],
      };

      Transforms.insertNodes(editor, mentionElement);
      Transforms.move(editor);
    },
    [editor, removeMention]
  );

  return {
    editor,
    openSuggestions,
    insertMention,
    removeMention,
  };
}

export function getTriggers(triggers: Trigger[], suggestions?: Suggestion[]) {
  const allTriggers = [...triggers];
  suggestions?.forEach((s) => {
    if (triggers.every((t) => t.value !== s.trigger)) {
      allTriggers.push({ value: s.trigger });
    }
  });
  return allTriggers;
}

export function isMentionElement(element: any): element is MentionElement {
  return element && element.type === "mention";
}

function isParagraphElement(element: any): element is ParagraphElement {
  return element && element.type === "paragraph";
}

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

function removeZeroWidthChars(text: string) {
  return text.replace(/[\u200B-\u200D\uFEFF]/g, "");
}

export function hasZeroWidthChars(text: string) {
  return /[\u200B-\u200D\uFEFF]/g.test(text);
}

export function getPlainText(editor: Editor) {
  let plainText = "";
  getAllNodes(editor)
    .filter(([node]) => !Text.isText(node) || !!node.text)
    .forEach(([node]) => {
      if (isParagraphElement(node)) {
        plainText += "\n";
      } else if (isMentionElement(node)) {
        plainText += `${node.trigger}${node.value}`;
      } else if (Text.isText(node)) {
        plainText += node.text;
      }
    });
  return removeZeroWidthChars(plainText);
}

export function insertMention(opt: InsertMentionOptions) {
  const {
    value,
    trigger: { value: trigger, style },
    editor,
    target,
  } = opt;
  Transforms.select(editor, target);
  const mention: MentionElement = {
    type: "mention",
    trigger,
    style,
    value,
    children: [{ text: "" }],
  };
  Transforms.insertNodes(editor, mention);
  Transforms.move(editor);
}

export function addSpaceAfterMention(editor: Editor) {
  const nodes = getAllNodes(editor);
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index][0];
    const nodeBefore = index > 0 ? nodes[index - 1][0] : undefined;
    const textRightBeforeMention =
      isMentionElement(nodeBefore) &&
      Text.isText(node) &&
      /^\S$/.test(removeZeroWidthChars(node.text));
    if (textRightBeforeMention) {
      Transforms.move(editor, { reverse: true });
      Editor.insertText(editor, " ");
      Transforms.move(editor);
      return true;
    }
  }
}

export function getUserInputAtSelection(editor: Editor, triggers: Trigger[]) {
  const { selection } = editor;

  if (selection && Range.isCollapsed(selection)) {
    const [start] = Range.edges(selection);
    let textBefore = Editor.string(
      editor,
      Editor.range(editor, { path: [0, 0], offset: 0 }, start)
    );
    const escapedTriggers = triggers
      .map((t) => t.value)
      .map(escapeRegExp)
      .join("|");
    const pattern = `(^|\\s)(${escapedTriggers})(|\uFEFF|\\S+|\uFEFF\\S+)$`;
    const beforeMatch = textBefore.match(new RegExp(pattern));
    const beforeMatchExists =
      !!beforeMatch && beforeMatch.length > 2 && !!beforeMatch[0];
    // TODO check offset
    const offset = beforeMatchExists
      ? start.offset -
        beforeMatch[0].length +
        (beforeMatch[0].startsWith(" ") ? 1 : 0)
      : 0;
    const beforeRange =
      beforeMatch &&
      Editor.range(
        editor,
        {
          ...start,
          offset,
        },
        start
      );
    const trigger =
      beforeMatchExists && triggers.find((t) => t.value === beforeMatch[2]);

    const after = Editor.after(editor, start);
    const afterRange = Editor.range(editor, start, after);
    const afterText = Editor.string(editor, afterRange);
    const afterMatch = afterText.match(/^(\s|$)/);

    if (beforeMatch && afterMatch && beforeRange && trigger) {
      return {
        target: beforeRange,
        trigger: trigger,
        search: removeZeroWidthChars(beforeMatch[3]),
      };
    }
  }
}

export function getAllNodes(editor: Editor) {
  return Array.from(
    Editor.nodes<ParagraphElement | MentionElement | CustomText>(editor, {
      at: [],
      match: (n) =>
        !Editor.isEditor(n) &&
        (isParagraphElement(n) || isMentionElement(n) || Text.isText(n)),
    })
  ).filter((node, index) => !(index === 0 && isParagraphElement(node[0])));
}

export function getLastNode(editor: Editor) {
  const nodes = getAllNodes(editor);
  return [...nodes].pop();
}

export function setSuggestionsPosition(
  editor: Editor,
  elem: HTMLElement,
  target: BaseRange
) {
  try {
    const domRange = ReactEditor.toDOMRange(editor, target);
    const rect = domRange.getBoundingClientRect();

    if (
      elem.offsetWidth + rect.left + window.pageXOffset <
      window.outerWidth - 16
    ) {
      elem.style.left = `${rect.left + window.pageXOffset}px`;
      elem.style.right = "auto";
    } else {
      elem.style.left = "auto";
      elem.style.right = "16px";
    }

    elem.style.top = `${rect.top + window.pageYOffset + 24}px`;
  } catch (e) {
    //
  }
}

function getMentionsFromPlaintext(text: string, triggers: string[]) {
  const pattern = `(\\s|^)(${triggers.map(escapeRegExp).join("|")})\\S+`;

  const result: {
    value: string;
    trigger: string;
    start: number;
    end: number;
  }[] = [];

  for (let match of text.matchAll(new RegExp(pattern, "g"))) {
    const trigger = match[2];
    const value = match[0].trim().substring(trigger.length);
    const start = match[0].startsWith(" ") ? match.index! + 1 : match.index!;
    const end = start + match[0].trim().length - 1;
    result.push({
      value,
      trigger,
      start,
      end,
    });
  }

  return result;
}

export function getDescendants(text = "", triggers: Trigger[]) {
  const descendant: Descendant[] = [];

  const mentions = getMentionsFromPlaintext(
    text,
    triggers.map((t) => t.value)
  );

  for (let index = 0; index < mentions.length; index++) {
    const { value, start, end, trigger } = mentions[index];
    const mentionBefore = index - 1 >= 0 ? mentions[index - 1] : undefined;
    const mentionAfter =
      index + 1 < mentions.length ? mentions[index + 1] : undefined;
    const textBefore = mentionBefore
      ? text.substring(mentionBefore.end + 1, start)
      : text.substring(0, start);

    if (textBefore) {
      descendant.push({
        text: textBefore,
      });
    }

    const style = triggers.find((t) => t.value === trigger)?.style;

    descendant.push({
      type: "mention",
      trigger,
      value,
      style,
      children: [{ text: "" }],
    });

    if (!mentionAfter) {
      const textAfter = text.substring(end + 1, text.length);
      if (textAfter) {
        descendant.push({
          text: textAfter,
        });
      }
    }
  }

  if (mentions.length === 0 && text) {
    descendant.push({
      text,
    });
  }

  // add empty text element at the end for autofocus
  descendant.push({
    text: "",
  });

  return descendant;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
