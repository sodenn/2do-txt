import Editor from "@draft-js-plugins/editor";
import { EntryComponentProps } from "@draft-js-plugins/mention/lib/MentionSuggestions/Entry/Entry";
import { styled, useTheme } from "@mui/material";
import "draft-js/dist/Draft.css";
import { FC, useEffect, useRef } from "react";
import { Trans } from "react-i18next";
import { SuggestionData, useTodoEditor } from "./task-editor-hook";

interface TodoEditorProps {
  label?: string;
  value?: string;
  onChange?: (value?: string) => void;
  onEnterPress?: () => void;
  placeholder?: string;
  suggestions: SuggestionData[];
}

const Fieldset = styled("fieldset")(({ theme }) => {
  const borderColor =
    theme.palette.mode === "light"
      ? "rgba(0, 0, 0, 0.23)"
      : "rgba(255, 255, 255, 0.23)";
  return {
    margin: 0,
    borderRadius: theme.shape.borderRadius,
    borderWidth: 1,
    borderColor: borderColor,
    borderStyle: "solid",
    cursor: "text",
    "&:hover": {
      borderColor: theme.palette.text.primary,
    },
  };
});

const Legend = styled("legend")`
  margin-left: -5px;
  font-size: 12px;
  padding: 0 4px;
`;

const EntryComponent: FC<EntryComponentProps> = (props) => {
  const {
    mention,
    theme,
    isFocused,
    searchValue,
    selectMention,
    ...parentProps
  } = props;

  return (
    <div {...parentProps}>
      <span className={theme?.mentionSuggestionsEntryText}>
        {mention.id === "new" ? (
          <Trans i18nKey="Add tag" values={{ name: mention.name }} />
        ) : (
          mention.name
        )}
      </span>
    </div>
  );
};

export const isSuggestionsPopupOpen = (
  elem: ParentNode | null | undefined = document
) => {
  const popover = elem?.querySelector(".mentionSuggestions");
  return !!popover;
};

const TaskEditor = (props: TodoEditorProps) => {
  const theme = useTheme();
  const editorContainerRef = useRef<HTMLFieldSetElement>(null);
  const {
    value,
    placeholder,
    label,
    onChange,
    onEnterPress,
    suggestions = [],
  } = props;

  const {
    ref,
    focus,
    setFocus,
    editorState,
    setEditorState,
    suggestionData,
    components,
    handlePastedText,
    handleOpenSuggestions,
    handleSearch,
    plugins,
  } = useTodoEditor({
    value,
    suggestions,
    onChange,
    themeMode: theme.palette.mode,
  });

  useEffect(() => {
    setTimeout(() => {
      ref.current?.focus();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Fieldset
        ref={editorContainerRef}
        style={
          focus
            ? {
                borderColor: theme.palette.primary.main,
                borderWidth: 2,
                padding: "7px 13px 12px 13px",
              }
            : { padding: "7px 14px 13px 14px" }
        }
      >
        {label && (
          <Legend sx={{ color: focus ? "primary.main" : "text.secondary" }}>
            {label}
          </Legend>
        )}
        <Editor
          ariaLabel="Text editor"
          placeholder={placeholder}
          editorKey="editor"
          editorState={editorState}
          onChange={setEditorState}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          handlePastedText={handlePastedText}
          handleReturn={() => {
            const suggestionsPopupOpen = isSuggestionsPopupOpen(
              editorContainerRef.current
            );
            if (!suggestionsPopupOpen && onEnterPress && value) {
              onEnterPress();
              return "handled";
            } else {
              return suggestionsPopupOpen ? "not-handled" : "handled";
            }
          }}
          plugins={plugins}
          ref={ref}
        />
        {components.map((item, index) => {
          const { trigger, comp: Comp } = item;
          const data = suggestionData.find((s) => s.trigger === trigger);
          if (data) {
            return (
              <Comp
                key={index}
                open={data.open}
                suggestions={data.suggestions}
                onOpenChange={(open) => handleOpenSuggestions(data, open)}
                onSearchChange={(val) => handleSearch(data, val)}
                entryComponent={EntryComponent}
              />
            );
          } else {
            return null;
          }
        })}
      </Fieldset>
    </div>
  );
};

export default TaskEditor;
