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
  value?: string;
  onChange?: (value: string) => void;
  suggestions?: Suggestion[];
  addMentionText?: (value: string) => string;
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
    label,
    placeholder,
    value,
    autoFocus,
    onChange,
    suggestions,
    addMentionText,
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
  const [descendants, setDescendants] = useState(
    getDescendants(value || "", triggers)
  );
  const renderElement = useCallback(
    ({ children, ...rest }: RenderElementProps) => (
      <Element {...rest}>{children}</Element>
    ),
    []
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
            insertMention(editor, chars[index], trigger);
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
    [chars, editor, index, closeSuggestions, target, trigger]
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
      if (plainText !== value) {
        onChange(plainText);
      }
    }
  }, [openSuggestions, editor, onChange, value]);

  const handleClick = useCallback(() => openSuggestions(), [openSuggestions]);

  const handleClickSuggestion = useCallback(
    (index: number) => {
      if (target && trigger) {
        Transforms.select(editor, target);
        insertMention(editor, chars[index], trigger);
        closeSuggestions();
        ReactEditor.focus(editor);
      }
    },
    [chars, editor, closeSuggestions, target, trigger]
  );

  const handleClickAddMention = useCallback(() => {
    if (target && trigger) {
      Transforms.select(editor, target);
      insertMention(editor, search, trigger);
      closeSuggestions();
      ReactEditor.focus(editor);
    }
  }, [target, trigger, editor, search, closeSuggestions]);

  useEffect(() => {
    if (target && elem && chars.length > 0) {
      setComboboxPosition(editor, elem, target);
    }
  }, [chars.length, editor, index, search, target, elem]);

  useEffect(() => {
    setDescendants(getDescendants(value, triggers));
  }, [triggers, value]);

  useEffect(() => {
    if (autoFocus) {
      //ReactEditor.focus(editor);
      // document
      //   .querySelector<HTMLDivElement>('[data-slate-editor="true"]')
      //   ?.focus();
      // document
      //   .querySelector<HTMLDivElement>('[data-slate-editor="true"]')
      //   ?.firstChild// @ts-ignore
      //   ?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

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
                        <MenuItem onClick={handleClickAddMention} selected>
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
