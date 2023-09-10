import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { mergeRegister } from "@lexical/utils";
import {
  Box,
  FormControl,
  FormLabel,
  MenuItem,
  MenuList,
  Typography,
  styled,
} from "@mui/joy";
import {
  $createParagraphNode,
  $getRoot,
  BLUR_COMMAND,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  EditorState,
  FOCUS_COMMAND,
  KEY_ENTER_COMMAND,
  LineBreakNode,
} from "lexical";
import {
  $convertToMentionNodes,
  BeautifulMentionNode,
  BeautifulMentionsItemsProps,
  BeautifulMentionsMenuItemProps,
  BeautifulMentionsMenuProps,
  BeautifulMentionsPlugin,
  ZeroWidthNode,
  ZeroWidthPlugin,
} from "lexical-beautiful-mentions";
import React, {
  ComponentProps,
  ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import "./Editor.css";

interface EditorContextProps {
  initialValue: string;
  triggers: string[];
  children: React.JSX.Element | string | (React.JSX.Element | string)[];
}

interface EditorProps
  extends Pick<BeautifulMentionsItemsProps, "items">,
    Omit<ComponentProps<typeof ContentEditable>, "onChange" | "label"> {
  onChange: (value: string) => void;
  onEnter: () => void;
  label?: ReactNode;
  placeholder?: string;
}

type Trigger = "@" | "\\+" | "due:" | "\\w+:";

const styleMap: Record<Trigger, string> = {
  "@": "Editor-mention Editor-context",
  "\\+": "Editor-mention Editor-project",
  "due:": "Editor-mention Editor-due",
  "\\w+:": "Editor-mention Editor-tag",
} as const;

function getMentionStyle(trigger: Trigger) {
  return {
    [trigger]: styleMap[trigger],
    [trigger + "Focused"]: "Editor-focused",
  };
}

function useMentionStyles(): Record<string, string> {
  return useMemo(
    () => ({
      ...getMentionStyle("@"),
      ...getMentionStyle("\\+"),
      ...getMentionStyle("due:"),
      ...getMentionStyle("\\w+:"),
    }),
    [],
  );
}

function useEditorConfig(triggers: string[], initialValue: string) {
  const styles = useMentionStyles();
  return useMemo(
    () => ({
      onError(error: any) {
        console.log(error);
      },
      editorState: setEditorState(initialValue, triggers),
      // @ts-ignore
      nodes: [BeautifulMentionNode, ZeroWidthNode],
      namespace: "",
      theme: {
        beautifulMentions: styles,
      },
    }),
    [initialValue, styles, triggers],
  );
}

function useIsFocused() {
  const [editor] = useLexicalComposerContext();
  const [hasFocus, setHasFocus] = useState(
    () => editor.getRootElement() === document.activeElement,
  );
  useLayoutEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          setHasFocus(true);
          return false;
        },
        COMMAND_PRIORITY_NORMAL,
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          setHasFocus(false);
          return false;
        },
        COMMAND_PRIORITY_NORMAL,
      ),
    );
  }, [editor]);

  return hasFocus;
}

function SingleLinePlugin({
  onEnter,
  mentionMenuOpen,
}: {
  onEnter?: () => void;
  mentionMenuOpen: boolean;
}) {
  const [editor] = useLexicalComposerContext();
  useEffect(
    () =>
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          if (
            event &&
            onEnter &&
            !mentionMenuOpen &&
            !event.shiftKey &&
            !event.ctrlKey &&
            !event.metaKey
          ) {
            onEnter();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    [editor, mentionMenuOpen, onEnter],
  );
  useEffect(
    () =>
      editor.registerNodeTransform(LineBreakNode, (node) => {
        node.remove();
      }),
    [editor],
  );
  return null;
}

function setEditorState(initialValue: string, triggers: string[]) {
  return () => {
    const root = $getRoot();
    if (root.getFirstChild() === null) {
      const paragraph = $createParagraphNode();
      paragraph.append(...$convertToMentionNodes(initialValue, triggers));
      root.append(paragraph);
    }
  };
}

const Textbox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "focused",
})<{ focused?: boolean }>(({ theme, focused }) => ({
  "--Input-focused": "0",
  "--Input-focusedThickness": "var(--joy-focus-thickness)",
  "--Input-focusedHighlight": "var(--joy-palette-primary-500)",
  position: "relative",
  borderRadius: theme.radius.sm,
  border: `1px solid ${theme.palette.neutral.outlinedBorder}`,
  padding: `7px 12px`,
  "&.focused": {
    "--Input-focused": 1,
  },
  ...(focused && {
    "&::before": {
      boxSizing: "border-box",
      content: "''",
      display: "block",
      position: "absolute",
      pointerEvents: "none",
      inset: 0,
      zIndex: 1,
      margin: "calc(var(--variant-borderWidth, 0px) * -1)",
      borderRadius: theme.radius.sm,
      boxShadow:
        "var(--Input-focusedInset, inset) 0 0 0 calc(var(--Input-focused) * var(--Input-focusedThickness)) var(--Input-focusedHighlight)",
    },
  }),
}));

const Placeholder = styled(Typography)({
  "--Textarea-placeholderColor": "inherit",
  "--Textarea-placeholderOpacity": 0.64,
  color: "var(--Textarea-placeholderColor)",
  opacity: "var(--Textarea-placeholderOpacity)",
  position: "absolute",
  pointerEvents: "none",
  left: 12,
  top: 7,
  display: "inline-block",
  userSelect: "none",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

const MenuComponent = forwardRef<HTMLUListElement, BeautifulMentionsMenuProps>(
  (props, ref) => {
    const { loading, children, ...other } = props;
    return (
      <MenuList sx={{ mt: "24px" }} ref={ref} variant="outlined" {...other}>
        {children}
      </MenuList>
    );
  },
);

const MenuItemComponent = forwardRef<
  HTMLDivElement,
  BeautifulMentionsMenuItemProps
>(({ itemValue, ...other }, ref) => {
  return <MenuItem ref={ref} {...other} />;
});

export function EditorContext({
  initialValue,
  triggers,
  children,
}: EditorContextProps) {
  const initialConfig = useEditorConfig(triggers, initialValue);
  return (
    <LexicalComposer initialConfig={initialConfig}>{children}</LexicalComposer>
  );
}

export function Editor(props: EditorProps) {
  const {
    label,
    placeholder,
    items,
    onChange,
    onEnter,
    ...contentEditableProps
  } = props;
  const focused = useIsFocused();
  const [editor] = useLexicalComposerContext();
  const [mentionMenuOpen, setMentionMenuOpen] = useState(false);

  const handleChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const root = $getRoot();
        onChange(root.getTextContent());
      });
    },
    [onChange],
  );

  const handleClick = useCallback(() => {
    editor.focus();
  }, [editor]);

  const handleMentionsMenuOpen = useCallback(() => {
    setMentionMenuOpen(true);
  }, []);

  const handleMentionsMenuClose = useCallback(() => {
    setMentionMenuOpen(false);
  }, []);

  return (
    <FormControl>
      {label && <FormLabel onClick={handleClick}>{label}</FormLabel>}
      <Textbox focused={focused} className={focused ? "focused" : undefined}>
        <PlainTextPlugin
          contentEditable={
            <ContentEditable
              style={{
                tabSize: 1,
                position: "relative",
                resize: "none",
                outline: "none",
              }}
              {...contentEditableProps}
            />
          }
          placeholder={<Placeholder>{placeholder}</Placeholder>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={handleChange} />
        <HistoryPlugin />
        <AutoFocusPlugin defaultSelection="rootEnd" />
        <ZeroWidthPlugin />
        <SingleLinePlugin onEnter={onEnter} mentionMenuOpen={mentionMenuOpen} />
        <BeautifulMentionsPlugin
          items={items}
          menuComponent={MenuComponent}
          menuItemComponent={MenuItemComponent}
          creatable
          insertOnBlur
          allowSpaces={false}
          menuAnchorClassName="Editor-mention-anchor"
          onMenuOpen={handleMentionsMenuOpen}
          onMenuClose={handleMentionsMenuClose}
        />
      </Textbox>
    </FormControl>
  );
}
