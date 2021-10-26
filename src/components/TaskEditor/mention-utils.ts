import { MentionData } from "@draft-js-plugins/mention";
import { ContentState, convertFromRaw, convertToRaw } from "draft-js";

export interface Suggestion {
  trigger: string;
  suggestions: string[];
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

export const createMentionEntities = (
  text: string,
  suggestions: Suggestion[]
) => {
  const rawContent = convertToRaw(ContentState.createFromText(text));

  const getType = (trigger: string) => {
    const isDefault = trigger === "@";
    if (isDefault) {
      return "mention";
    } else {
      return trigger + "mention";
    }
  };

  (rawContent as any).entityMap = [];

  rawContent.blocks = rawContent.blocks.map((block) => {
    const ranges: { key: number; length: number; offset: number }[] = [];
    suggestions.forEach((item) => {
      item.suggestions.forEach((suggestion) => {
        const searchStr = item.trigger + suggestion;
        const entityRanges = getEntityRanges(
          block.text,
          searchStr,
          ranges.length
        );
        if (entityRanges) {
          entityRanges.forEach((entityRange) => {
            (rawContent as any).entityMap.push({
              type: getType(item.trigger),
              mutability: "IMMUTABLE",
              data: { mention: { name: suggestion } },
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
  oldSuggestions: Suggestion[]
) => {
  const regExp = new RegExp(`(@|\\+|\\S+:)(\\S+)`, "gm");
  const matches: RegExpMatchArray[] = [];

  let match: RegExpMatchArray | null;
  while ((match = regExp.exec(text)) !== null) {
    matches.push(match);
  }

  const newSuggestions: Suggestion[] = [];

  matches.forEach((match) => {
    const trigger = match[1];
    const suggestions = [match[2]];
    const item = newSuggestions.find((i) => i.trigger === trigger);
    if (item && suggestions.length > 0) {
      item.suggestions = [...item.suggestions, ...suggestions];
    } else if (suggestions.length > 0) {
      newSuggestions.push({ trigger, suggestions });
    }
  });

  const filteredSuggestions: Suggestion[] = [];

  newSuggestions.forEach((newSuggestion) => {
    const oldSuggestion = oldSuggestions.find(
      (i) => i.trigger === newSuggestion.trigger
    );
    if (
      oldSuggestion &&
      JSON.stringify(oldSuggestion.suggestions) !==
        JSON.stringify(newSuggestion.suggestions)
    ) {
      const suggestions = newSuggestion.suggestions.filter(
        (i) => !oldSuggestion.suggestions.includes(i)
      );
      if (suggestions.length > 0) {
        filteredSuggestions.push({ ...newSuggestion, suggestions });
      }
    } else if (!oldSuggestion) {
      filteredSuggestions.push(newSuggestion);
    }
  });

  return filteredSuggestions;
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
