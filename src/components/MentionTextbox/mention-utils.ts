import { useCallback, useMemo } from "react";
import {
  BaseRange,
  createEditor,
  Descendant,
  Editor,
  Range,
  Transforms,
} from "slate";
import { withHistory } from "slate-history";
import { ReactEditor, withReact } from "slate-react";
import {
  CustomText,
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
      Editor.insertText(editor, trigger);
    },
    [editor]
  );

  const insertMention = useCallback(
    (trigger: Trigger, value: string) => {
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
    [editor]
  );

  const removeMention = useCallback(
    (trigger: string, value?: string) => {
      editor.children.forEach((element) => {
        if (isParagraphElement(element)) {
          element.children.forEach((child) => {
            if (
              isMentionElement(child) &&
              child.trigger === trigger &&
              (!value || value === child.value)
            ) {
              const path = ReactEditor.findPath(editor, child);
              Transforms.removeNodes(editor, { at: path });
            }
          });
        }
      });
      Transforms.move(editor);
    },
    [editor]
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
  return element.type === "mention";
}

export function isParagraphElement(element: any): element is ParagraphElement {
  return element.type === "paragraph";
}

export function isTextElement(element: any): element is CustomText {
  return element.hasOwnProperty("text");
}

export function withMentions(editor: Editor) {
  const { isInline, isVoid } = editor;

  editor.isInline = (element) => {
    return element.type === "mention" ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === "mention" ? true : isVoid(element);
  };

  return editor;
}

export function removeZeroWidthChars(text: string) {
  return text.replace(/[\u200B-\u200D\uFEFF]/g, "");
}

export function hasZeroWidthChars(text: string) {
  return /[\u200B-\u200D\uFEFF]/g.test(text);
}

export function getPlainText(editor: Editor) {
  const children = editor.children.flatMap((c) =>
    isParagraphElement(c) ? c.children : []
  );

  let plainText = "";
  children.forEach((c) => {
    if (isMentionElement(c)) {
      plainText += `${c.trigger}${c.value}`;
    } else if (isTextElement(c)) {
      plainText += c.text;
    }
  });

  return removeZeroWidthChars(plainText);
}

export function insertMention(
  editor: Editor,
  value: string,
  { value: trigger, style }: Trigger
) {
  const mention: MentionElement = {
    type: "mention",
    trigger,
    style,
    value,
    children: [{ text: "" }],
  };
  Transforms.insertNodes(editor, mention);
  Transforms.move(editor);
  Transforms.insertText(editor, " ");
}

export function getUserInputAtSelection(editor: Editor, triggers: Trigger[]) {
  const { selection } = editor;

  if (selection && Range.isCollapsed(selection)) {
    const [start] = Range.edges(selection);
    let textBefore = Editor.string(
      editor,
      Editor.range(editor, { path: [0, 0], offset: 0 }, start)
    );
    const hadZeroWidthChars = hasZeroWidthChars(textBefore);
    textBefore = hadZeroWidthChars
      ? removeZeroWidthChars(textBefore)
      : textBefore;
    const escapedTriggers = triggers
      .map((t) => t.value)
      .map(escapeRegExp)
      .join("|");
    const pattern = `(^|\\s)(${escapedTriggers})(|\\S+)$`;
    const beforeMatch = textBefore.match(new RegExp(pattern));
    const beforeRange =
      beforeMatch &&
      beforeMatch.length > 0 &&
      typeof beforeMatch[0] !== "undefined" &&
      Editor.range(
        editor,
        {
          ...start,
          offset:
            start.offset -
            beforeMatch[0].length +
            (beforeMatch[0].startsWith(" ") ? 1 : 0) +
            (hadZeroWidthChars ? -1 : 0),
        },
        start
      );

    const after = Editor.after(editor, start);
    const afterRange = Editor.range(editor, start, after);
    const afterText = Editor.string(editor, afterRange);
    const afterMatch = afterText.match(/^(\s|$)/);

    const trigger =
      beforeMatch &&
      beforeMatch.length > 2 &&
      triggers.find((t) => t.value === beforeMatch[2]);

    if (beforeMatch && afterMatch && beforeRange && trigger) {
      return {
        target: beforeRange,
        trigger: trigger,
        search: beforeMatch[3],
      };
    }
  }
}

function getLastChild(
  children: Descendant[]
): MentionElement | CustomText | undefined {
  if (children.length > 0) {
    const lastChild = children[children.length - 1];
    if (isParagraphElement(lastChild)) {
      return getLastChild(lastChild.children);
    } else {
      return lastChild;
    }
  }
}

export function getLasPath(editor: Editor) {
  const lastChild = getLastChild(editor.children);
  return ReactEditor.findPath(editor, lastChild as any);
}

export function setSuggestionsPosition(
  editor: Editor,
  elem: HTMLElement,
  target: BaseRange
) {
  try {
    const domRange = ReactEditor.toDOMRange(editor, target);
    const rect = domRange.getBoundingClientRect();
    elem.style.top = `${rect.top + window.pageYOffset + 24}px`;
    elem.style.left = `${rect.left + window.pageXOffset}px`;
  } catch (e) {
    //
  }
}

export function getMentionsFromPlaintext(text: string, triggers: string[]) {
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
      value: value,
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

  descendant.push({
    text: "",
  });

  return descendant;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
