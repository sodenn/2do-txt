import { MentionData } from "@draft-js-plugins/mention";
import { ContentState, convertFromRaw, convertToRaw } from "draft-js";

export interface MentionGroup {
  trigger: string;
  items: string[];
}

const getIndicesOf = (
  searchStr: string,
  str: string,
  caseSensitive?: boolean
) => {
  let tempStr = str;
  let tempSearchStr = searchStr;
  const searchStrLen = tempSearchStr.length;
  if (searchStrLen === 0) {
    return [];
  }
  let startIndex = 0;
  let index;
  const indices = [];
  if (!caseSensitive) {
    tempStr = tempStr.toLowerCase();
    tempSearchStr = tempSearchStr.toLowerCase();
  }

  while ((index = tempStr.indexOf(tempSearchStr, startIndex)) > -1) {
    indices.push(index);
    startIndex = index + searchStrLen;
  }
  return indices;
};

const getEntityRanges = (text: string, searchStr: string, key: number) => {
  const indices = getIndicesOf(searchStr, text);
  if (indices.length > 0) {
    return indices.map((offset) => ({
      key: key++,
      length: searchStr.length,
      offset: offset,
    }));
  }
};

export const getTypeByTrigger = (trigger: string) => {
  const isDefault = trigger === "@";
  if (isDefault) {
    return "mention";
  } else {
    return trigger + "mention";
  }
};

export const createMentionEntities = (
  text: string,
  mentionGroups: MentionGroup[]
) => {
  const rawContent = convertToRaw(ContentState.createFromText(text));

  (rawContent as any).entityMap = [];

  rawContent.blocks = rawContent.blocks.map((block) => {
    const ranges: { key: number; length: number; offset: number }[] = [];
    mentionGroups.forEach((group) => {
      group.items.forEach((item) => {
        const searchStr = group.trigger + item;
        const entityRanges = getEntityRanges(
          block.text,
          searchStr,
          ranges.length
        );
        if (entityRanges) {
          entityRanges.forEach((entityRange) => {
            (rawContent as any).entityMap.push({
              type: getTypeByTrigger(group.trigger),
              mutability: "IMMUTABLE",
              data: { mention: { name: item } },
            });
            ranges.push(entityRange);
          });
        }
      });
    });
    return { ...block, entityRanges: ranges };
  });

  return convertFromRaw(rawContent);
};

export const getNewSuggestions = (
  text: string,
  oldMentionGroups: MentionGroup[]
) => {
  const regExp = new RegExp(`(@|\\+|\\S+:)(\\S+)`, "gm");
  const matches: RegExpMatchArray[] = [];

  let match: RegExpMatchArray | null;
  while ((match = regExp.exec(text)) !== null) {
    matches.push(match);
  }

  const newMentionGroups: MentionGroup[] = [];

  matches.forEach((match) => {
    const trigger = match[1];
    const items = [match[2]];
    const group = newMentionGroups.find((i) => i.trigger === trigger);
    if (group && items.length > 0) {
      group.items = [...group.items, ...items];
    } else if (items.length > 0) {
      newMentionGroups.push({ trigger, items });
    }
  });

  const filteredMentionGroup: MentionGroup[] = [];

  newMentionGroups.forEach((newGroup) => {
    const oldGroup = oldMentionGroups.find(
      (i) => i.trigger === newGroup.trigger
    );
    if (
      oldGroup &&
      JSON.stringify(oldGroup.items) !== JSON.stringify(newGroup.items)
    ) {
      const newItems = newGroup.items.filter(
        (i) => !oldGroup.items.includes(i)
      );
      if (newItems.length > 0) {
        filteredMentionGroup.push({ ...newGroup, items: newItems });
      }
    } else if (!oldGroup) {
      filteredMentionGroup.push(newGroup);
    }
  });

  return filteredMentionGroup;
};

export const mapMentionData = (str: string): MentionData => {
  return { name: str };
};

export const sortMentionData = (a: MentionData, b: MentionData): -1 | 0 | 1 => {
  if (a.name > b.name) {
    return 1;
  } else if (a.name < b.name) {
    return -1;
  } else {
    return 0;
  }
};

export const isMentionSuggestionsPopoverOpen = () => {
  const popover = document.body.querySelector(".mentionSuggestions");
  return !!popover;
};
