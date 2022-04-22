import {
  ClickAwayListener,
  Fade,
  MenuItem,
  MenuList,
  Paper,
  Portal,
  styled,
  useTheme,
} from "@mui/material";
import React, {
  ClipboardEvent,
  FocusEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Descendant, Editor, Range, Transforms } from "slate";
import { Editable, ReactEditor, RenderElementProps, Slate } from "slate-react";
import Element from "./Element";
import { Suggestion, Trigger } from "./mention-types";
import {
  getDescendants,
  getLasPath,
  getPlainText,
  getTriggers,
  getUserInputAtSelection,
  insertMention,
  setSuggestionsPosition,
} from "./mention-utils";

interface MentionTextFieldProps {
  triggers: Trigger[];
  autoFocus?: boolean;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  editor: Editor;
  suggestions?: Suggestion[];
  onChange?: (value: string) => void;
  addMentionText?: (value: string) => string;
  onEnterPress?: () => void;
  "aria-label"?: string | undefined;
}

const Legend = styled("legend")`
  margin-left: -5px;
  font-size: 12px;
  padding: 0 4px;
`;

const Fieldset = styled("fieldset")(({ theme }) => {
  const borderColor =
    theme.palette.mode === "light"
      ? "rgba(0, 0, 0, 0.23)"
      : "rgba(255, 255, 255, 0.23)";
  return {
    userSelect: "auto",
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

const MentionTextField = (props: MentionTextFieldProps) => {
  const {
    triggers: _triggers,
    autoFocus,
    label,
    placeholder,
    initialValue = "",
    editor,
    suggestions,
    onChange,
    addMentionText,
    onEnterPress,
  } = props;
  const theme = useTheme();
  const [focus, setFocus] = useState(false);
  const [elem, setElem] = useState<HTMLDivElement | null>(null);
  const [target, setTarget] = useState<Range | null>(null);
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const triggers = useMemo(
    () => getTriggers(_triggers, suggestions),
    [_triggers, suggestions]
  );
  const renderElement = useCallback(
    ({ children, ...rest }: RenderElementProps) => (
      <Element {...rest}>{children}</Element>
    ),
    []
  );
  const descendants = useMemo<Descendant[]>(
    () => [
      {
        type: "paragraph",
        children: getDescendants(initialValue, triggers),
      },
    ],
    [initialValue, triggers]
  );
  const chars = useMemo(() => {
    const list =
      suggestions
        ?.find((s) => s.trigger === trigger?.value)
        ?.items.filter((c) =>
          c.toLowerCase().startsWith(search.toLowerCase())
        ) || [];
    if (!!search && list.every((c) => c !== search)) {
      list.push(search);
    }
    return list;
  }, [suggestions, search, trigger]);
  const showAddMenuItem =
    !!search &&
    suggestions
      ?.find((s) => s.trigger === trigger?.value)
      ?.items.every((c) => c !== search);

  const closeSuggestions = useCallback(() => {
    setTarget(null);
    setTrigger(null);
  }, []);

  const openSuggestions = useCallback(() => {
    const result = getUserInputAtSelection(editor, triggers);
    if (result) {
      setTarget(result.target);
      setSearch(result.search);
      setTrigger(result.trigger);
      setIndex(0);
    } else {
      closeSuggestions();
    }
  }, [editor, triggers, closeSuggestions]);

  const handleKeyDown = useCallback(
    (event: any) => {
      switch (event.key) {
        case "ArrowDown":
          if (target) {
            event.preventDefault();
            const prevIndex = index >= chars.length - 1 ? 0 : index + 1;
            setIndex(prevIndex);
          }
          break;
        case "ArrowUp":
          if (target) {
            event.preventDefault();
            const nextIndex = index <= 0 ? chars.length - 1 : index - 1;
            setIndex(nextIndex);
          }
          break;
        case "Tab":
          if (target && trigger) {
            Transforms.select(editor, target);
            const value = index < chars.length ? chars[index] : search;
            insertMention(editor, value, trigger);
            closeSuggestions();
          }
          break;
        case "Enter":
          event.preventDefault();
          if (target && trigger) {
            Transforms.select(editor, target);
            const value = index < chars.length ? chars[index] : search;
            insertMention(editor, value, trigger);
            closeSuggestions();
          } else if (!target && onEnterPress) {
            onEnterPress();
          }
          break;
        case "Escape":
          if (target && trigger) {
            event.preventDefault();
            event.stopPropagation();
            closeSuggestions();
          }
          break;
        case " ":
          if (target && trigger) {
            Transforms.select(editor, target);
            const value = search.trim();
            insertMention(editor, value, trigger);
            closeSuggestions();
          }
          break;
      }
    },
    [
      target,
      trigger,
      onEnterPress,
      index,
      chars,
      editor,
      search,
      closeSuggestions,
    ]
  );

  const handleChange = useCallback(() => {
    openSuggestions();
    if (onChange) {
      const plainText = getPlainText(editor);
      onChange(plainText);
    }
  }, [openSuggestions, editor, onChange]);

  const handleClick = useCallback(() => openSuggestions(), [openSuggestions]);

  const handleClickSuggestion = useCallback(
    (index?: number) => {
      if (target && trigger) {
        Transforms.select(editor, target);
        const value =
          typeof index !== "undefined" && index < chars.length
            ? chars[index]
            : search;
        insertMention(editor, value, trigger);
        closeSuggestions();
        ReactEditor.focus(editor);
      }
    },
    [target, trigger, editor, chars, search, closeSuggestions]
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const data = event.clipboardData.getData("text");
      const text = data.replace(/(\r\n|\n|\r)/gm, "");
      const descendants = getDescendants(text, triggers);
      Transforms.insertNodes(editor, descendants);
      Transforms.move(editor);
      editor.onChange();
    },
    [editor, triggers]
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (elem?.contains(event.relatedTarget)) {
        return;
      }
      const result = getUserInputAtSelection(editor, triggers);
      if (result && result.search) {
        Transforms.select(editor, result.target);
        insertMention(editor, result.search, result.trigger);
      }
      setFocus(false);
    },
    [editor, elem, triggers]
  );

  useEffect(() => {
    if (target && elem && (chars.length > 0 || search.length > 0)) {
      setSuggestionsPosition(editor, elem, target);
    }
  }, [chars.length, editor, index, search, target, elem]);

  useEffect(() => {
    if (autoFocus) {
      ReactEditor.focus(editor);
      const path = getLasPath(editor);
      Transforms.select(editor, path);
    }
  }, [autoFocus, editor]);

  return (
    <Fieldset
      onClick={() => ReactEditor.focus(editor)}
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
        <Legend
          sx={{
            color: focus ? "primary.main" : "text.secondary",
          }}
        >
          {label}
        </Legend>
      )}
      <Slate editor={editor} value={descendants} onChange={handleChange}>
        <Editable
          aria-label={props["aria-label"]}
          renderElement={renderElement}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocus(true)}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={placeholder}
        />
        {target && (chars.length > 0 || search.length > 0) && (
          <Portal>
            <Fade in>
              <div
                ref={setElem}
                style={{
                  top: "-9999px",
                  left: "-9999px",
                  position: "absolute",
                  zIndex: theme.zIndex.modal + 1,
                }}
                data-testid="mentions-portal"
              >
                <ClickAwayListener onClickAway={closeSuggestions}>
                  <Paper elevation={2}>
                    <MenuList>
                      {chars.map((char, i) => (
                        <MenuItem
                          onClick={() =>
                            showAddMenuItem && char === search
                              ? handleClickSuggestion()
                              : handleClickSuggestion(i)
                          }
                          key={char}
                          selected={i === index}
                        >
                          {showAddMenuItem &&
                            char === search &&
                            addMentionText &&
                            addMentionText(search)}
                          {showAddMenuItem &&
                            char === search &&
                            !addMentionText &&
                            `Add "${search}"`}
                          {(!showAddMenuItem || char !== search) && char}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Paper>
                </ClickAwayListener>
              </div>
            </Fade>
          </Portal>
        )}
      </Slate>
    </Fieldset>
  );
};

export default MentionTextField;
