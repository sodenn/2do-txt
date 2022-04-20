import { BaseRange, Descendant, Editor, Range, Transforms } from "slate";
import { ReactEditor } from "slate-react";
import {
  CustomText,
  MentionElement,
  ParagraphElement,
  Suggestion,
  Trigger,
} from "./mention-types";

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

export function isParagraph(element: any): element is ParagraphElement {
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

export function toPlainText(editor: Editor) {
  const children = editor.children.flatMap((c) =>
    isParagraph(c) ? c.children : []
  );

  let plainText = "";
  children.forEach((c) => {
    if (isMentionElement(c)) {
      plainText += `${c.trigger}${c.character}`;
    } else if (isTextElement(c)) {
      plainText += c.text;
    }
  });

  return plainText;
}

export function insertMention(
  editor: Editor,
  character: string,
  { value: trigger, style }: Trigger
) {
  const mention: MentionElement = {
    type: "mention",
    trigger,
    style,
    character,
    children: [{ text: "" }],
  };
  Transforms.insertNodes(editor, mention);
  Transforms.move(editor);
}

export function getComboboxTarget(editor: Editor, triggers: Trigger[]) {
  const { selection } = editor;

  if (selection && Range.isCollapsed(selection)) {
    const [start] = Range.edges(selection);
    const textBefore = Editor.string(
      editor,
      Editor.range(editor, { path: [0, 0], offset: 0 }, start)
    );
    const escapedTriggers = triggers
      .map((t) => t.value)
      .map(escapeRegExp)
      .join("|");
    const pattern = `(?<=\\s|^)(${escapedTriggers})(|\\S+)$`;
    const beforeMatch = textBefore.match(new RegExp(pattern));
    const beforeRange =
      beforeMatch &&
      beforeMatch.length > 0 &&
      typeof beforeMatch[0] !== "undefined" &&
      Editor.range(
        editor,
        { ...start, offset: start.offset - beforeMatch[0].length },
        start
      );

    const after = Editor.after(editor, start);
    const afterRange = Editor.range(editor, start, after);
    const afterText = Editor.string(editor, afterRange);
    const afterMatch = afterText.match(/^(\s|$)/);

    const trigger =
      beforeMatch &&
      beforeMatch.length > 1 &&
      triggers.find((t) => t.value === beforeMatch[1]);

    if (beforeMatch && afterMatch && beforeRange && trigger) {
      return {
        target: beforeRange,
        trigger: trigger,
        search: beforeMatch[2],
      };
    }
  }
}

export function setComboboxPosition(
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
  const pattern = `(?<=\\s|^)(${triggers.map(escapeRegExp).join("|")})\\S+`;

  const result: {
    value: string;
    trigger: string;
    start: number;
    end: number;
  }[] = [];

  for (let match of text.matchAll(new RegExp(pattern, "g"))) {
    const value = match[0];
    const trigger = match[1];
    const start = match.index!;
    const end = start + value.length - 1;
    result.push({
      value: value.substring(trigger.length),
      trigger,
      start,
      end,
    });
  }

  return result;
}

export function getDescendants(value = "", triggers: Trigger[]) {
  const children: Descendant[] = [];

  const mentions = getMentionsFromPlaintext(
    value,
    triggers.map((t) => t.value)
  );

  for (let index = 0; index < mentions.length; index++) {
    const { value: character, start, end, trigger } = mentions[index];
    const mentionBefore = index - 1 >= 0 ? mentions[index - 1] : undefined;
    const mentionAfter =
      index + 1 < mentions.length ? mentions[index + 1] : undefined;
    const textBefore = mentionBefore
      ? value.substring(mentionBefore.end + 1, start)
      : value.substring(0, start);

    if (textBefore) {
      children.push({
        text: textBefore,
      });
    }

    const style = triggers.find((t) => t.value === trigger)?.style;

    children.push({
      type: "mention",
      trigger,
      character: character,
      style,
      children: [{ text: "" }],
    });

    if (!mentionAfter) {
      const textAfter = value.substring(end + 1, value.length);
      children.push({
        text: textAfter,
      });
    }
  }

  if (mentions.length === 0) {
    children.push({
      text: value,
    });
  }

  const descendants: Descendant[] = [
    {
      type: "paragraph",
      children,
    },
  ];

  return descendants;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
