import { hasTouchScreen } from "@/native-api/platform";
import { usePlatformStore } from "@/stores/platform-store";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { mergeRegister } from "@lexical/utils";
import {
  Box,
  FormControl,
  FormLabel,
  MenuItem,
  MenuList,
  styled,
  Typography,
} from "@mui/joy";
import {
  $createParagraphNode,
  $getRoot,
  $isElementNode,
  BLUR_COMMAND,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  EditorState,
  FOCUS_COMMAND,
  KEY_ENTER_COMMAND,
  LexicalNode,
  LineBreakNode,
} from "lexical";
import {
  $convertToMentionNodes,
  $isZeroWidthNode,
  BeautifulMentionNode,
  BeautifulMentionsItemsProps,
  BeautifulMentionsMenuItemProps,
  BeautifulMentionsMenuProps,
  BeautifulMentionsPlugin,
  ZERO_WIDTH_CHARACTER,
  ZeroWidthNode,
  ZeroWidthPlugin,
} from "lexical-beautiful-mentions";
import React, {
  ComponentProps,
  forwardRef,
  ReactNode,
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

function SingleLinePlugin({ onEnter }: { onEnter?: () => void }) {
  const [editor] = useLexicalComposerContext();
  useEffect(
    () =>
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          if (
            event &&
            onEnter &&
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
    [editor, onEnter],
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
  "--Input-focusedThickness": theme.vars.focus.thickness,
  "--Input-focusedHighlight": theme.vars.palette.primary["500"],
  p: {
    margin: 0,
  },
  position: "relative",
  borderRadius: theme.vars.radius.sm,
  border: `1px solid ${theme.vars.palette.neutral.outlinedBorder}`,
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
      borderRadius: theme.vars.radius.sm,
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
      <MenuList
        sx={{
          position: "absolute",
          top: 2,
          m: 0,
          minWidth: "7rem",
          overflow: "hidden",
        }}
        ref={ref}
        variant="outlined"
        {...other}
      >
        {children}
      </MenuList>
    );
  },
);

const MenuItemComponent = forwardRef<
  HTMLDivElement,
  BeautifulMentionsMenuItemProps
>(({ item, ...other }, ref) => {
  return (
    <MenuItem
      sx={{ whiteSpace: "nowrap" }}
      ref={ref}
      {...other}
      aria-label={`Choose "${item}"`}
    />
  );
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

function getTextContent(node: LexicalNode): string {
  let result = "";
  if ($isElementNode(node)) {
    const children = node.getChildren();
    for (const child of children) {
      result += getTextContent(child);
    }
  } else if (!$isZeroWidthNode(node)) {
    result += node.getTextContent();
  }
  return result;
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
  const touchScreen = hasTouchScreen();
  const platform = usePlatformStore((state) => state.platform);

  const handleChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const root = $getRoot();
        const text = getTextContent(root);
        onChange(text);
      });
    },
    [onChange],
  );

  const handleClick = useCallback(() => {
    editor.focus();
  }, [editor]);

  return (
    <FormControl>
      {label && <FormLabel onClick={handleClick}>{label}</FormLabel>}
      <Textbox focused={focused} className={focused ? "focused" : undefined}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              style={{
                tabSize: 1,
                position: "relative",
                resize: "none",
                outline: "none",
              }}
              // needed because the cursor keeps blinking in Safari when clicking outside the editor
              onBlur={() => editor.blur()}
              {...contentEditableProps}
            />
          }
          placeholder={<Placeholder>{placeholder}</Placeholder>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={handleChange} />
        <HistoryPlugin />
        {!(touchScreen && platform === "web") && (
          <AutoFocusPlugin defaultSelection="rootEnd" />
        )}
        <ZeroWidthPlugin textContent={ZERO_WIDTH_CHARACTER} />
        <SingleLinePlugin onEnter={onEnter} />
        <BeautifulMentionsPlugin
          items={items}
          menuComponent={MenuComponent}
          menuItemComponent={MenuItemComponent}
          creatable
          insertOnBlur
          allowSpaces={false}
          menuAnchorClassName="Editor-mention-anchor"
        />
      </Textbox>
    </FormControl>
  );
}
