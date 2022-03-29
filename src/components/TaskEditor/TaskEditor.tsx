import Editor from "@draft-js-plugins/editor";
import { EntryComponentProps } from "@draft-js-plugins/mention/lib/MentionSuggestions/Entry/Entry";
import { PopoverProps } from "@draft-js-plugins/mention/lib/MentionSuggestions/Popover";
import {
  Box,
  MenuItem,
  MenuList,
  styled,
  Typography,
  useTheme,
} from "@mui/material";
import "draft-js/dist/Draft.css";
import { FC, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trans } from "react-i18next";
import { usePopper } from "react-popper";
import { isMentionSuggestionsPopoverOpen } from "./mention-utils";
import { MentionGroup, useTaskEditor } from "./task-editor-hook";
import "./TaskEditor.css";

interface TaskEditorProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  onEnterPress?: () => void;
  onAddMention?: (plainText: string) => void;
  placeholder?: string;
  mentions: MentionGroup[];
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

const PopoverContainer: FC<PopoverProps> = (props) => {
  const { store, children, popperOptions } = props;
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);

  const { styles, attributes } = usePopper(
    store.getReferenceElement(),
    popperElement,
    popperOptions
  );

  return createPortal(
    <Box
      ref={setPopperElement}
      style={styles.popper}
      {...attributes.popper}
      className="mentionSuggestions"
      sx={{
        maxWidth: { xs: 300, sm: 500, md: 700 },
        boxShadow: 8,
        borderRadius: 1,
        zIndex: "modal",
      }}
    >
      <MenuList sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
        {children}
      </MenuList>
    </Box>,
    document.body
  );
};

const EntryComponent: FC<EntryComponentProps> = (props) => {
  const {
    mention,
    theme,
    isFocused,
    className,
    searchValue,
    selectMention,
    ...parentProps
  } = props;

  return (
    <MenuItem {...parentProps} selected={isFocused}>
      <Typography variant="inherit" noWrap>
        {mention.id === "new" ? (
          <Trans i18nKey="Add tag" values={{ name: mention.name }} />
        ) : (
          mention.name
        )}
      </Typography>
    </MenuItem>
  );
};

const TaskEditor = (props: TaskEditorProps) => {
  const theme = useTheme();
  const editorContainerRef = useRef<HTMLFieldSetElement>(null);
  const {
    value,
    placeholder,
    label,
    onChange,
    onAddMention,
    onEnterPress,
    mentions = [],
  } = props;

  const {
    ref,
    focus,
    setFocus,
    editorState,
    mentionSuggestionGroups,
    components,
    handleChange,
    handleKeyBind,
    handlePastedText,
    handleOpenMentionSuggestions,
    handleSearchMention,
    handleAddMention,
    plugins,
  } = useTaskEditor({
    value,
    mentions,
    onChange,
    onAddMention,
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
        onClick={() => ref.current?.focus()}
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
          onChange={handleChange}
          keyBindingFn={handleKeyBind}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          handlePastedText={handlePastedText}
          handleReturn={() => {
            const open = isMentionSuggestionsPopoverOpen();
            if (!open && onEnterPress && value) {
              onEnterPress();
              return "handled";
            } else {
              return open ? "not-handled" : "handled";
            }
          }}
          plugins={plugins}
          ref={ref}
        />
        {components.map((item, index) => {
          const { trigger, comp: Comp } = item;
          const mentionSuggestions = mentionSuggestionGroups.find(
            (s) => s.trigger === trigger
          );
          if (mentionSuggestions) {
            return (
              <Comp
                key={index}
                open={mentionSuggestions.open}
                suggestions={mentionSuggestions.items}
                onOpenChange={(open) =>
                  handleOpenMentionSuggestions(mentionSuggestions.trigger, open)
                }
                onSearchChange={(val) =>
                  handleSearchMention(mentionSuggestions, val)
                }
                onAddMention={handleAddMention}
                popoverContainer={PopoverContainer}
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
