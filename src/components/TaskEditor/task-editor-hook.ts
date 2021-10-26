import Editor from "@draft-js-plugins/editor";
import createMentionPlugin, {
  defaultSuggestionsFilter,
  MentionData,
  MentionPluginConfig,
} from "@draft-js-plugins/mention";
import clsx from "clsx";
import {
  ContentState,
  DraftHandleValue,
  EditorState,
  Modifier,
} from "draft-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { uniqueListBy } from "../../utils/array";
import {
  mentionClassStyle,
  mentionStyles,
  mentionSuggestionsDarkStyle,
  mentionSuggestionsEntryContainerStyle,
  mentionSuggestionsEntryFocusedDarkStyle,
  mentionSuggestionsEntryFocusedLightStyle,
  mentionSuggestionsEntryFocusedStyle,
  mentionSuggestionsEntryStyle,
  mentionSuggestionsEntryTextDarkStyle,
  mentionSuggestionsEntryTextLightStyle,
  mentionSuggestionsEntryTextStyle,
  mentionSuggestionsLightStyle,
} from "./mention-styles";
import { createMentionEntities, mapMentionData } from "./mention-utils";

export interface SuggestionData {
  suggestions: string[];
  trigger: string;
  styleClass?: string;
}

interface TaskEditorHook {
  value?: string;
  onChange?: (value?: string) => void;
  suggestions: SuggestionData[];
  themeMode: "light" | "dark";
}

interface HookSuggestionData extends Omit<SuggestionData, "suggestions"> {
  suggestions: MentionData[];
  open: boolean;
}

export const useTodoEditor = (props: TaskEditorHook) => {
  const { value, suggestions: _suggestions = [], onChange, themeMode } = props;

  const suggestions = useMemo(
    () =>
      _suggestions.map((item) => ({
        ...item,
        suggestions: item.suggestions.filter(
          (i, pos, self) => self.indexOf(i) === pos
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(_suggestions)]
  );

  const ref = useRef<Editor>(null);
  const [editorState, setEditorState] = useState(() =>
    value
      ? EditorState.createWithContent(createMentionEntities(value, suggestions))
      : EditorState.createEmpty()
  );

  const [focus, setFocus] = useState(false);
  const [suggestionData, setSuggestionData] = useState<HookSuggestionData[]>(
    suggestions.map((item) => ({
      ...item,
      suggestions: item.suggestions.map(mapMentionData),
      open: false,
    }))
  );

  const handleOpenSuggestions = useCallback(
    (suggestionData: HookSuggestionData, open: boolean) => {
      setSuggestionData((value) =>
        value.map((item) => {
          if (item.trigger === suggestionData.trigger) {
            return {
              ...suggestionData,
              suggestions: suggestions
                .filter((i) => i.trigger === item.trigger)
                .flatMap((i) => i.suggestions)
                .map(mapMentionData),
              open,
            };
          } else {
            return item;
          }
        })
      );
    },
    [suggestions]
  );

  const handleSearch = useCallback(
    (data: HookSuggestionData, { value: searchValue }: { value: string }) => {
      setSuggestionData((value) =>
        value.map((item) => {
          const sug = suggestions
            .filter((i) => i.trigger === item.trigger)
            .flatMap((i) => i.suggestions)
            .map(mapMentionData);
          if (
            item.trigger === data.trigger &&
            searchValue &&
            !searchValue.includes(" ")
          ) {
            const uniqueSug = uniqueListBy(
              [{ name: searchValue }, ...sug],
              "name"
            );
            return {
              ...item,
              suggestions: defaultSuggestionsFilter(searchValue, uniqueSug),
            };
          } else if (item.trigger === data.trigger && searchValue) {
            return {
              ...item,
              suggestions: defaultSuggestionsFilter(searchValue, sug),
            };
          } else if (item.trigger === data.trigger) {
            return {
              ...item,
              suggestions: sug,
            };
          } else {
            return { ...item };
          }
        })
      );
    },
    [suggestions]
  );

  const handlePastedText = useCallback(
    (
      text: string,
      html: string | undefined,
      editorState: EditorState
    ): DraftHandleValue => {
      const singleLineText = text.replace(/(\r\n|\n|\r)/gm, " ");
      const pastedBlocks =
        ContentState.createFromText(singleLineText).getBlockMap();
      const newState = Modifier.replaceWithFragment(
        editorState.getCurrentContent(),
        editorState.getSelection(),
        pastedBlocks
      );
      const newEditorState = EditorState.push(
        editorState,
        newState,
        "insert-fragment"
      );
      setEditorState(newEditorState);
      return "handled";
    },
    []
  );

  useEffect(() => {
    const plainText = editorState.getCurrentContent().getPlainText();
    if (onChange) {
      onChange(plainText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorState.getCurrentContent().getPlainText()]);

  const { plugins, components } = useMemo(() => {
    const mentionPluginConfig: MentionPluginConfig = {
      entityMutability: "IMMUTABLE",
      supportWhitespace: false,
      theme: {
        mentionSuggestions: clsx(
          "mentionSuggestions",
          mentionStyles,
          {
            [mentionSuggestionsLightStyle]: themeMode === "light",
          },
          {
            [mentionSuggestionsDarkStyle]: themeMode !== "light",
          }
        ),
        mentionSuggestionsEntryContainer: mentionSuggestionsEntryContainerStyle,
        mentionSuggestionsEntry: mentionSuggestionsEntryStyle,
        mentionSuggestionsEntryFocused: clsx(
          mentionSuggestionsEntryFocusedStyle,
          {
            [mentionSuggestionsEntryFocusedLightStyle]: themeMode === "light",
          },
          {
            [mentionSuggestionsEntryFocusedDarkStyle]: themeMode !== "light",
          }
        ),
        mentionSuggestionsEntryText: clsx(
          mentionSuggestionsEntryTextStyle,
          {
            [mentionSuggestionsEntryTextLightStyle]: themeMode === "light",
          },
          {
            [mentionSuggestionsEntryTextDarkStyle]: themeMode !== "light",
          }
        ),
      },
    };

    const plugins = suggestions.map((item) => ({
      trigger: item.trigger,
      plugin: createMentionPlugin({
        ...mentionPluginConfig,
        popperOptions: {
          placement: "bottom-start",
          modifiers: [{ name: "offset", options: { offset: [0, 2] } }],
        },
        mentionPrefix: item.trigger,
        mentionTrigger: item.trigger,
        theme: {
          mention: clsx(mentionClassStyle, item.styleClass),
          ...mentionPluginConfig.theme,
        },
      }),
    }));

    return {
      plugins: plugins.map((item) => item.plugin),
      components: plugins.map((item) => ({
        comp: item.plugin.MentionSuggestions,
        trigger: item.trigger,
      })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(suggestions), themeMode]);

  return {
    ref,
    editorState,
    setEditorState,
    focus,
    setFocus,
    suggestionData,
    handlePastedText,
    handleOpenSuggestions,
    handleSearch,
    plugins,
    components,
  };
};
