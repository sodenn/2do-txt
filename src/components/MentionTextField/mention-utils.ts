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
      const lastElement = getLastElement(editor.children);
      if (
        isMentionElement(lastElement) ||
        (isTextElement(lastElement) && !!lastElement.text)
      ) {
        Editor.insertText(editor, ` ${trigger}`);
      } else {
        Editor.insertText(editor, trigger);
      }
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
    },
    [editor]
  );

  const insertMention = useCallback(
    (trigger: Trigger, value: string, uniqueTrigger = false) => {
      if (uniqueTrigger) {
        removeMention(trigger.value);
      }

      const startOfLine = isStartOfLine(editor.children);
      const lastElement = getLastElement(editor.children);
      if (
        !startOfLine &&
        (!isTextElement(lastElement) || !lastElement.text.endsWith(" "))
      ) {
        Transforms.insertNodes(editor, [{ text: " " }]);
        Transforms.move(editor);
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

export function isTextElement(element: any): element is CustomText {
  return element && element.hasOwnProperty("text");
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

export function insertMention(opt: InsertMentionOptions) {
  const {
    value,
    trigger: { value: trigger, style },
    editor,
    target,
  } = opt;
  Transforms.select(editor, target);

  // Note: Normally, addSpaceAfterMention causes a space to be inserted before the mention.
  // This doesn't work on mobile browsers because they contain a zero-width character.
  const lastElement = getLastElement(editor.children);
  if (
    (!isTextElement(lastElement) || !lastElement.text.endsWith(" ")) &&
    target.focus.offset - target.anchor.offset === 2 &&
    target.focus.path[1] > 0
  ) {
    Transforms.insertText(editor, " ");
  }

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
  const elements = editor.children;
  if (elements.length > 0) {
    const paragraph = elements[elements.length - 1];
    if (isParagraphElement(paragraph)) {
      const children = paragraph.children;
      if (children.length > 1) {
        const secondLastElement = children[children.length - 2];
        const lastElement = children[children.length - 1];
        const textRightBeforeMention =
          isMentionElement(secondLastElement) &&
          isTextElement(lastElement) &&
          /^\S$/.test(removeZeroWidthChars(lastElement.text));
        if (textRightBeforeMention) {
          Transforms.move(editor, { reverse: true });
          Editor.insertText(editor, " ");
          Transforms.move(editor);
          return true;
        }
      }
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
    const zeroWidthChars = hasZeroWidthChars(textBefore);
    // remove the zero-width characters otherwise the regex won't work
    textBefore = zeroWidthChars ? removeZeroWidthChars(textBefore) : textBefore;
    const escapedTriggers = triggers
      .map((t) => t.value)
      .map(escapeRegExp)
      .join("|");
    const pattern = `(^|\\s)(${escapedTriggers})(|\\S+)$`;
    const beforeMatch = textBefore.match(new RegExp(pattern));
    const beforeMatchExists =
      !!beforeMatch && beforeMatch.length > 2 && !!beforeMatch[0];
    const offset = beforeMatchExists
      ? start.offset -
        beforeMatch[0].length +
        (beforeMatch[0].startsWith(" ") ? 1 : 0) +
        (zeroWidthChars ? -1 : 0)
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
        search: beforeMatch[3],
      };
    }
  }
}

export function getLastElement(
  elements: Descendant[]
): MentionElement | CustomText | undefined {
  if (elements.length > 0) {
    const lastElement = elements[elements.length - 1];
    if (isParagraphElement(lastElement)) {
      return getLastElement(lastElement.children);
    } else {
      return lastElement;
    }
  }
}

export function isStartOfLine(elements: Descendant[]): boolean {
  if (elements.length > 0) {
    const element = elements[elements.length - 1];
    if (isParagraphElement(element)) {
      if (element.children.length === 0) {
        return true;
      } else if (element.children.length === 1) {
        const child = element.children[0];
        return isTextElement(child) && !child.text;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } else {
    return true;
  }
}

export function getLasPath(editor: Editor) {
  const lastElement = getLastElement(editor.children);
  return ReactEditor.findPath(editor, lastElement as any);
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
