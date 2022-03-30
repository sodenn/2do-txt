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
import { mentionClass } from "./mention-styles";
import {
  createMentionEntities,
  getTypeByTrigger,
  mapMentionData,
} from "./mention-utils";

export interface MentionGroup {
  items: string[];
  trigger: string;
  styleClass?: string;
}

export interface MentionSuggestionGroup {
  items: MentionData[];
  trigger: string;
  open: boolean;
}

interface TaskEditorOptions {
  value?: string;
  onChange?: (value: string) => void;
  onAddMention?: (plainText: string) => void;
  mentions: MentionGroup[];
  themeMode: "light" | "dark";
}

export const useTaskEditor = (props: TaskEditorOptions) => {
  const { value, onChange, onAddMention, themeMode } = props;
  const mentions = props.mentions.map((group) => ({
    ...group,
    items: group.items.filter((i, pos, self) => self.indexOf(i) === pos),
  }));
  const ref = useRef<Editor>(null);
  const [focus, setFocus] = useState(false);
  const [searchValue, setSearchValue] =
    useState<{ trigger: string; value: string }>();
  const [editorState, setEditorState] = useState(() =>
    value
      ? EditorState.createWithContent(createMentionEntities(value, mentions))
      : EditorState.createEmpty()
  );
  const [mentionSuggestionGroups, setMentionSuggestionGroups] = useState<
    MentionSuggestionGroup[]
  >(
    mentions.map((group) => ({
      ...group,
      items: group.items.map(mapMentionData),
      open: false,
    }))
  );

  const { plugins, components } = useMemo(() => {
    const mentionPluginConfig: MentionPluginConfig = {
      entityMutability: "IMMUTABLE",
      supportWhitespace: false,
    };

    const plugins = mentions.map((item) => ({
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
          mention: clsx(mentionClass, item.styleClass),
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
  }, [JSON.stringify(mentions), themeMode]);

  const handleOpenMentionSuggestions = useCallback(
    (trigger: string, open: boolean) => {
      const newMentionSuggestionsData: MentionSuggestionGroup[] =
        mentionSuggestionGroups.map((mentionSuggestion) => {
          if (mentionSuggestion.trigger === trigger) {
            const items = mentions
              .filter((i) => i.trigger === mentionSuggestion.trigger)
              .flatMap((i) => i.items)
              .filter((i) =>
                !searchValue || !searchValue.value
                  ? true
                  : i.toLowerCase().includes(searchValue.value.toLowerCase())
              )
              .map(mapMentionData);
            if (
              searchValue &&
              searchValue.value &&
              items.every((i) => i.name !== searchValue.value)
            ) {
              items.push({ name: searchValue.value, id: "new" });
            }
            return {
              trigger,
              items,
              open,
            };
          } else {
            return mentionSuggestion;
          }
        });
      setMentionSuggestionGroups(newMentionSuggestionsData);
    },
    /* eslint-disable react-hooks/exhaustive-deps */
    [
      JSON.stringify(mentions),
      JSON.stringify(mentionSuggestionGroups),
      searchValue,
    ]
    /* eslint-enable react-hooks/exhaustive-deps */
  );

  const handleSearchMention = useCallback(
    (
      data: MentionSuggestionGroup,
      { value: searchValue }: { value: string }
    ) => {
      setSearchValue({ value: searchValue, trigger: data.trigger });

      const newMentionSuggestionsData = mentionSuggestionGroups.map(
        (mentionSuggestions) => {
          const suggestionItems = uniqueListBy(
            mentions
              .filter((i) => i.trigger === mentionSuggestions.trigger)
              .flatMap((i) => i.items)
              .map(mapMentionData),
            "name"
          );
          if (
            mentionSuggestions.trigger === data.trigger &&
            searchValue &&
            !searchValue.includes(" ")
          ) {
            if (suggestionItems.every((i) => i.name !== searchValue)) {
              suggestionItems.push({ name: searchValue, id: "new" });
            }
            return {
              ...mentionSuggestions,
              items: defaultSuggestionsFilter(searchValue, suggestionItems),
            };
          } else if (
            mentionSuggestions.trigger === data.trigger &&
            searchValue
          ) {
            return {
              ...mentionSuggestions,
              items: defaultSuggestionsFilter(searchValue, suggestionItems),
            };
          } else if (mentionSuggestions.trigger === data.trigger) {
            return {
              ...mentionSuggestions,
              items: suggestionItems,
            };
          } else {
            return { ...mentionSuggestions };
          }
        }
      );

      setMentionSuggestionGroups(newMentionSuggestionsData);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(mentions), JSON.stringify(mentionSuggestionGroups)]
  );

  const handleAddMention = useCallback(() => {
    if (searchValue) {
      setSearchValue(undefined);
    }
    if (onAddMention) {
      // execute in the next event loop tick otherwise the dropdown menu keeps open
      setTimeout(() => {
        onAddMention(editorState.getCurrentContent().getPlainText());
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // add mention if the selection has changed

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
        setMentionSuggestionGroups((groups) =>
          groups.map((g) => ({ ...g, open: false }))
        );
      } else {
        setEditorState(state);
      }
    },
    [editorState, searchValue]
  );

  const handleKeyBind = useCallback(
    (e: KeyboardEvent<{}>) => {
      // add mention via space key
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
        setMentionSuggestionGroups(
          mentionSuggestionGroups.map((i) =>
            i.trigger === searchValue.trigger ? { ...i, open: false } : i
          )
        );
        return "add-mention";
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(mentionSuggestionGroups), editorState, searchValue]
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
    mentionSuggestionGroups,
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
