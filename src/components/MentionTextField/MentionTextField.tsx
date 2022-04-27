import { ClickAwayListener, useTheme } from "@mui/material";
import React, {
  ClipboardEvent,
  FocusEvent,
  forwardRef,
  MouseEvent,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Descendant, Range, Text, Transforms } from "slate";
import { Editable, ReactEditor, RenderElementProps, Slate } from "slate-react";
import { WithChildren } from "../../types/common";
import Element from "./Element";
import {
  MentionTextFieldProps,
  SuggestionListItemProps,
  Trigger,
} from "./mention-types";
import {
  addSpaceAfterMention,
  getDescendants,
  getLastNode,
  getPlainText,
  getTriggers,
  getUserInputAtSelection,
  insertMention,
  setSuggestionsPosition,
} from "./mention-utils";

const Portal = ({ children }: WithChildren) => {
  return typeof document === "object"
    ? createPortal(children, document.body)
    : null;
};

const SuggestionList = forwardRef<HTMLUListElement, WithChildren>(
  ({ children }, ref) => <ul ref={ref}>{children}</ul>
);

const SuggestionListItem = (
  props: PropsWithChildren<SuggestionListItemProps>
) => <li {...props} />;

const MentionTextField = (props: MentionTextFieldProps) => {
  const {
    triggers: _triggers,
    autoFocus,
    placeholder,
    initialValue: _initialValue = "",
    editor,
    suggestions,
    onChange,
    addMentionText,
    onEnterPress,
    suggestionListComponent: SuggestionListComponent = SuggestionList,
    suggestionListItemComponent:
      SuggestionListItemComponent = SuggestionListItem,
    onPaste,
    onClick,
    onFocus,
    onBlur,
    onKeyDown,
    ...rest
  } = props;
  const theme = useTheme();
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
  const initialValue = useMemo<Descendant[]>(
    () => [
      {
        type: "paragraph",
        children: getDescendants(_initialValue, triggers),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const filteredSuggestions = useMemo(() => {
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
            const prevIndex =
              index >= filteredSuggestions.length - 1 ? 0 : index + 1;
            setIndex(prevIndex);
          } else {
            onKeyDown && onKeyDown(event);
          }
          break;
        case "ArrowUp":
          if (target) {
            event.preventDefault();
            const nextIndex =
              index <= 0 ? filteredSuggestions.length - 1 : index - 1;
            setIndex(nextIndex);
          } else {
            onKeyDown && onKeyDown(event);
          }
          break;
        case "Tab":
          if (target && trigger) {
            const value =
              index < filteredSuggestions.length
                ? filteredSuggestions[index]
                : search;
            insertMention({ editor, value, trigger, target });
            closeSuggestions();
          }
          onKeyDown && onKeyDown(event);
          break;
        case "Enter":
          event.preventDefault();
          if (target && trigger) {
            const value =
              index < filteredSuggestions.length
                ? filteredSuggestions[index]
                : search;
            insertMention({ editor, value, trigger, target });
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
          } else {
            onKeyDown && onKeyDown(event);
          }
          break;
        case " ":
          const value = search.trim();
          if (target && trigger && value) {
            insertMention({ editor, value, trigger, target });
            closeSuggestions();
          }
          onKeyDown && onKeyDown(event);
          break;
      }
    },
    [
      target,
      trigger,
      onEnterPress,
      index,
      filteredSuggestions,
      editor,
      search,
      onKeyDown,
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

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      openSuggestions();
      if (onClick) {
        onClick(event);
      }
    },
    [onClick, openSuggestions]
  );

  const handleClickSuggestion = useCallback(
    (index?: number) => {
      if (target && trigger) {
        const value =
          typeof index !== "undefined" && index < filteredSuggestions.length
            ? filteredSuggestions[index]
            : search;
        insertMention({ editor, value, trigger, target });
        closeSuggestions();
        ReactEditor.focus(editor);
      }
    },
    [target, trigger, editor, filteredSuggestions, search, closeSuggestions]
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      const data = event.clipboardData.getData("text");
      const text = data.replace(/(\r\n|\n|\r)/gm, "");
      const descendants = getDescendants(text, triggers);
      Transforms.insertNodes(editor, descendants);
      Transforms.move(editor);
      if (onPaste) {
        onPaste(event);
      }
    },
    [editor, onPaste, triggers]
  );

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (onFocus) {
        onFocus(event);
      }
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (elem?.contains(event.relatedTarget)) {
        return;
      }
      const result = getUserInputAtSelection(editor, triggers);
      if (result && result.search) {
        const { trigger, search, target } = result;
        insertMention({ editor, value: search, trigger, target });
      }
      if (onBlur) {
        onBlur(event);
      }
    },
    [editor, elem, onBlur, triggers]
  );

  useEffect(() => {
    if (
      target &&
      elem &&
      (filteredSuggestions.length > 0 || search.length > 0)
    ) {
      setSuggestionsPosition(editor, elem, target);
    }
  }, [filteredSuggestions.length, editor, index, search, target, elem]);

  useEffect(() => {
    addSpaceAfterMention(editor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.children]);

  useEffect(() => {
    if (autoFocus) {
      ReactEditor.focus(editor);
      const lastNode = getLastNode(editor);
      if (lastNode) {
        const [node, path] = lastNode;
        if (node && Text.isText(node) && !node.text) {
          Transforms.select(editor, path);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  return (
    <Slate editor={editor} value={initialValue} onChange={handleChange}>
      <Editable
        renderElement={renderElement}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPaste={handlePaste}
        placeholder={placeholder}
        {...rest}
      />
      {target && (filteredSuggestions.length > 0 || search.length > 0) && (
        <Portal>
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
              <SuggestionListComponent>
                {filteredSuggestions.map((char, i) => (
                  <SuggestionListItemComponent
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
                  </SuggestionListItemComponent>
                ))}
              </SuggestionListComponent>
            </ClickAwayListener>
          </div>
        </Portal>
      )}
    </Slate>
  );
};

export default MentionTextField;
