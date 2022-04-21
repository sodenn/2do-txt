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
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createEditor, Range, Transforms } from "slate";
import { withHistory } from "slate-history";
import {
  Editable,
  ReactEditor,
  RenderElementProps,
  Slate,
  withReact,
} from "slate-react";
import Element from "./Element";
import { Suggestion, Trigger } from "./mention-types";
import {
  getComboboxTarget,
  getDescendants,
  getLasPath,
  getTriggers,
  insertMention,
  setComboboxPosition,
  toPlainText,
  withMentions,
} from "./mention-utils";

interface MentionTextboxProps {
  triggers: Trigger[];
  autoFocus?: boolean;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  suggestions?: Suggestion[];
  onChange?: (value: string) => void;
  addMentionText?: (value: string) => string;
  onEnterPress?: () => void;
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

const MentionTextbox = (props: MentionTextboxProps) => {
  const {
    triggers: _triggers,
    autoFocus,
    label,
    placeholder,
    initialValue = "",
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
  const descendants = useMemo(
    () => getDescendants(initialValue, triggers),
    [initialValue, triggers]
  );
  const editor = useMemo(
    () => withMentions(withReact(withHistory(createEditor()))),
    []
  );
  const chars = useMemo(
    () =>
      suggestions
        ?.find((s) => s.trigger === trigger?.value)
        ?.items.filter((c) =>
          c.toLowerCase().startsWith(search.toLowerCase())
        ) || [],
    [suggestions, search, trigger]
  );

  const closeSuggestions = useCallback(() => {
    setTarget(null);
    setTrigger(null);
  }, []);

  const handleKeyDown = useCallback(
    (event: any) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (!target && onEnterPress) {
          onEnterPress();
        }
      }
      if (target && trigger) {
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            const prevIndex = index >= chars.length - 1 ? 0 : index + 1;
            setIndex(prevIndex);
            break;
          case "ArrowUp":
            event.preventDefault();
            const nextIndex = index <= 0 ? chars.length - 1 : index - 1;
            setIndex(nextIndex);
            break;
          case "Tab":
          case "Enter":
            Transforms.select(editor, target);
            const character = index < chars.length ? chars[index] : search;
            insertMention(editor, character, trigger);
            closeSuggestions();
            break;
          case "Escape":
            event.preventDefault();
            event.stopPropagation();
            closeSuggestions();
            break;
        }
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

  const openSuggestions = useCallback(() => {
    const result = getComboboxTarget(editor, triggers);
    if (result) {
      setTarget(result.target);
      setSearch(result.search);
      setTrigger(result.trigger);
      setIndex(0);
    } else {
      closeSuggestions();
    }
  }, [editor, triggers, closeSuggestions]);

  const handleChange = useCallback(() => {
    openSuggestions();
    if (onChange) {
      const plainText = toPlainText(editor);
      onChange(plainText);
    }
  }, [openSuggestions, editor, onChange]);

  const handleClick = useCallback(() => openSuggestions(), [openSuggestions]);

  const handleClickSuggestion = useCallback(
    (index?: number) => {
      if (target && trigger) {
        Transforms.select(editor, target);
        const character =
          typeof index !== "undefined" && index < chars.length
            ? chars[index]
            : search;
        insertMention(editor, character, trigger);
        closeSuggestions();
        ReactEditor.focus(editor);
      }
    },
    [target, trigger, editor, chars, search, closeSuggestions]
  );

  useEffect(() => {
    if (target && elem && chars.length > 0) {
      setComboboxPosition(editor, elem, target);
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
          renderElement={renderElement}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onPaste={(event) => {
            event.preventDefault();
            const data = event.clipboardData.getData("text");
            const text = data.replace(/(\r\n|\n|\r)/gm, "");
            editor.insertText(text);
            editor.onChange();
          }}
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
                      {chars.length === 0 && (
                        <MenuItem
                          onClick={() => handleClickSuggestion()}
                          selected
                        >
                          {addMentionText && search
                            ? addMentionText(search)
                            : `Add "${search}"`}
                        </MenuItem>
                      )}
                      {chars.map((char, i) => (
                        <MenuItem
                          onClick={() => handleClickSuggestion(i)}
                          key={char}
                          selected={i === index}
                        >
                          {char}
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

export default MentionTextbox;
