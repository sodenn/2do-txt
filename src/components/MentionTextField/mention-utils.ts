import { BaseRange, Descendant, Editor, Range, Text, Transforms } from "slate";
import { ReactEditor } from "slate-react";
import {
  CustomText,
  InsertMentionOptions,
  Mention,
  MentionElement,
  ParagraphElement,
} from "./mention-types";

export function isMentionElement(element: any): element is MentionElement {
  return element && element.type === "mention";
}

function isParagraphElement(element: any): element is ParagraphElement {
  return element && element.type === "paragraph";
}

function removeZeroWidthChars(text: string) {
  return text.replace(/[\u200B-\u200D\uFEFF]/g, "");
}

export function hasZeroWidthChars(text: string) {
  return /[\u200B-\u200D\uFEFF]/g.test(text);
}

export function getPlainText(editor: Editor) {
  let plainText = "";
  getAllNodesEntries(editor)
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
  const { trigger, style, value, editor, target } = opt;
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
  const nodes = getAllNodesEntries(editor).map(([node]) => node);
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    const nodeBefore = index > 0 ? nodes[index - 1] : undefined;
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

export function getUserInputAtSelection(editor: Editor, mentions: Mention[]) {
  const { selection } = editor;

  if (selection && Range.isCollapsed(selection)) {
    const [start] = Range.edges(selection);
    let textBefore = Editor.string(editor, Editor.range(editor, [0, 0], start));
    textBefore = textBefore.substring(textBefore.length - start.offset); // only the current line
    const escapedTriggers = mentions
      .map((m) => m.trigger)
      .map(escapeRegExp)
      .join("|");
    const pattern = `(^|\\s)(${escapedTriggers})(|\uFEFF|\\S+|\uFEFF\\S+)$`;
    const beforeMatch = textBefore.match(new RegExp(pattern));
    const beforeMatchExists =
      !!beforeMatch && beforeMatch.length > 2 && !!beforeMatch[0];
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
    const mention =
      beforeMatchExists && mentions.find((m) => m.trigger === beforeMatch[2]);

    const after = Editor.after(editor, start);
    const afterRange = Editor.range(editor, start, after);
    const afterText = Editor.string(editor, afterRange);
    const afterMatch = afterText.match(/^(\s|$)/);

    if (beforeMatch && afterMatch && beforeRange && mention) {
      return {
        target: beforeRange,
        mention,
        search: removeZeroWidthChars(beforeMatch[3]),
      };
    }
  }
}

export function getAllNodesEntries(editor: Editor) {
  return Array.from(
    Editor.nodes<ParagraphElement | MentionElement | CustomText>(editor, {
      at: [],
      match: (n) =>
        !Editor.isEditor(n) &&
        (isParagraphElement(n) || isMentionElement(n) || Text.isText(n)),
    })
  ).filter((node, index) => !(index === 0 && isParagraphElement(node[0])));
}

export function getLastNodeEntry(editor: Editor) {
  const nodeEntries = getAllNodesEntries(editor);
  return [...nodeEntries].pop();
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

export function getMentionElementData(text: string, triggers: string[]) {
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

export function getNodesFromPlainText(text = "", triggers: Mention[]) {
  const nodes: Descendant[] = [];

  const data = getMentionElementData(
    text,
    triggers.map((m) => m.trigger)
  );

  for (let index = 0; index < data.length; index++) {
    const { value, start, end, trigger } = data[index];
    const mentionBefore = index - 1 >= 0 ? data[index - 1] : undefined;
    const mentionAfter = index + 1 < data.length ? data[index + 1] : undefined;
    const textBefore = mentionBefore
      ? text.substring(mentionBefore.end + 1, start)
      : text.substring(0, start);

    if (textBefore) {
      nodes.push({
        text: textBefore,
      });
    }

    const style = triggers.find((m) => m.trigger === trigger)?.style;

    nodes.push({
      type: "mention",
      trigger,
      value,
      style,
      children: [{ text: "" }],
    });

    if (!mentionAfter) {
      const textAfter = text.substring(end + 1, text.length);
      if (textAfter) {
        nodes.push({
          text: textAfter,
        });
      }
    }
  }

  if (data.length === 0 && text) {
    nodes.push({
      text,
    });
  }

  // add an empty text note at the end for autofocusing
  nodes.push({
    text: "",
  });

  return nodes;
}

export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
