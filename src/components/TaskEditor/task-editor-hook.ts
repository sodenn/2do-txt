import Editor from "@draft-js-plugins/editor";
import createMentionPlugin, {
  addMention,
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
import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import {
  createMentionEntities,
  getTypeByTrigger,
  mapMentionData,
} from "./mention-utils";

export interface SuggestionData {
  suggestions: string[];
  trigger: string;
  styleClass?: string;
}

interface TaskEditorOptions {
  value?: string;
  onChange?: (value?: string) => void;
  suggestions: SuggestionData[];
  themeMode: "light" | "dark";
}

interface MentionSuggestionsProps {
  open: boolean;
  suggestions: MentionData[];
}

type MentionSuggestionsData = MentionSuggestionsProps &
  Pick<SuggestionData, "trigger">;

export const useTaskEditor = (props: TaskEditorOptions) => {
  const { value, onChange, themeMode } = props;
  const suggestions = props.suggestions.map((item) => ({
    ...item,
    suggestions: item.suggestions.filter(
      (i, pos, self) => self.indexOf(i) === pos
    ),
  }));
  const ref = useRef<Editor>(null);
  const [focus, setFocus] = useState(false);
  const [searchValue, setSearchValue] =
    useState<{ trigger: string; value: string }>();
  const [editorState, setEditorState] = useState(() =>
    value
      ? EditorState.createWithContent(createMentionEntities(value, suggestions))
      : EditorState.createEmpty()
  );
  const [mentionSuggestionsData, setMentionSuggestionsData] = useState<
    MentionSuggestionsData[]
  >(
    suggestions.map((item) => ({
      ...item,
      suggestions: item.suggestions.map(mapMentionData),
      open: false,
    }))
  );

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

  const handleOpenMentionSuggestions = useCallback(
    (trigger: string, open: boolean) => {
      const newMentionSuggestionsData: MentionSuggestionsData[] =
        mentionSuggestionsData.map((item) => {
          if (item.trigger === trigger) {
            const newSuggestions = suggestions
              .filter((i) => i.trigger === item.trigger)
              .flatMap((i) => i.suggestions)
              .filter((i) =>
                !searchValue || !searchValue.value
                  ? true
                  : i.toLowerCase().includes(searchValue.value.toLowerCase())
              )
              .map(mapMentionData);
            if (
              searchValue &&
              searchValue.value &&
              newSuggestions.every((i) => i.name !== searchValue.value)
            ) {
              newSuggestions.push({ name: searchValue.value, id: "new" });
            }
            return {
              trigger,
              suggestions: newSuggestions,
              open,
            };
          } else {
            return item;
          }
        });
      setMentionSuggestionsData(newMentionSuggestionsData);
    },
    [searchValue, mentionSuggestionsData, suggestions]
  );

  const handleSearchMention = useCallback(
    (
      data: MentionSuggestionsData,
      { value: searchValue }: { value: string }
    ) => {
      setSearchValue({ value: searchValue, trigger: data.trigger });

      const newMentionSuggestionsData = mentionSuggestionsData.map((item) => {
        const mentionDataList = uniqueListBy(
          suggestions
            .filter((i) => i.trigger === item.trigger)
            .flatMap((i) => i.suggestions)
            .map(mapMentionData),
          "name"
        );
        if (
          item.trigger === data.trigger &&
          searchValue &&
          !searchValue.includes(" ")
        ) {
          if (mentionDataList.every((i) => i.name !== searchValue)) {
            mentionDataList.push({ name: searchValue, id: "new" });
          }
          return {
            ...item,
            suggestions: defaultSuggestionsFilter(searchValue, mentionDataList),
          };
        } else if (item.trigger === data.trigger && searchValue) {
          return {
            ...item,
            suggestions: defaultSuggestionsFilter(searchValue, mentionDataList),
          };
        } else if (item.trigger === data.trigger) {
          return {
            ...item,
            suggestions: mentionDataList,
          };
        } else {
          return { ...item };
        }
      });

      setMentionSuggestionsData(newMentionSuggestionsData);
    },
    [mentionSuggestionsData, setSearchValue, suggestions]
  );

  const handleAddMention = useCallback(() => {
    if (searchValue) {
      setSearchValue(undefined);
    }
  }, [searchValue, setSearchValue]);

  const handleChange = useCallback(
    (state: EditorState) => {
      const currentPlainText = editorState.getCurrentContent().getPlainText();
      const newPlainText = state.getCurrentContent().getPlainText();

      const currentSelectionState = editorState.getSelection();
      const newSelectionState = state.getSelection();

      const currentStartOffset = currentSelectionState.getStartOffset();
      const newStartOffset = newSelectionState.getStartOffset();

      if (
        searchValue &&
        searchValue.value &&
        currentPlainText === newPlainText &&
        currentStartOffset !== newStartOffset
      ) {
        const stateWithEntity = editorState
          .getCurrentContent()
          .createEntity(getTypeByTrigger(searchValue.trigger), "IMMUTABLE", {
            mention: { name: searchValue.value },
          });

        const entityKey = stateWithEntity.getLastCreatedEntityKey();

        const newContentState = Modifier.replaceText(
          stateWithEntity,
          // The text to replace, which is represented as a range with a start & end offset.
          newSelectionState.merge({
            // The starting position of the range to be replaced
            anchorOffset:
              currentSelectionState.getEndOffset() -
              searchValue.trigger.length -
              searchValue.value.length,
            // The end position of the range to be replaced
            focusOffset: currentSelectionState.getEndOffset(),
          }),
          // The new string to replace the old string.
          searchValue.trigger + searchValue.value,
          editorState.getCurrentInlineStyle(),
          entityKey
        );

        const newEditorState = EditorState.push(
          editorState,
          newContentState,
          // @ts-ignore
          "replace-text"
        );

        setEditorState(newEditorState);
        setSearchValue(undefined);
      } else {
        setEditorState(state);
      }
    },
    [editorState, searchValue]
  );

  const handleKeyBind = useCallback(
    (e: KeyboardEvent<{}>) => {
      if (searchValue && searchValue.value && e.code === "Space") {
        const newEditorState = addMention(
          editorState,
          { name: searchValue.value },
          searchValue.trigger,
          searchValue.trigger,
          "IMMUTABLE"
        );
        setEditorState(newEditorState);
        setSearchValue(undefined);
        setMentionSuggestionsData(
          mentionSuggestionsData.map((i) =>
            i.trigger === searchValue.trigger ? { ...i, open: false } : i
          )
        );
        return "add-mention";
      }
    },
    [editorState, mentionSuggestionsData, searchValue]
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

  return {
    ref,
    editorState,
    setEditorState,
    focus,
    setFocus,
    mentionSuggestionsData,
    handlePastedText,
    handleOpenMentionSuggestions,
    handleSearchMention,
    handleAddMention,
    handleChange,
    handleKeyBind,
    plugins,
    components,
  };
};
