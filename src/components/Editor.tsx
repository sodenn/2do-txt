import { css } from "@emotion/css";
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
  Fade,
  MenuItem,
  MenuList,
  PaletteMode,
  Paper,
  Typography,
  styled,
  useTheme,
} from "@mui/material";
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
  BeautifulMentionNode,
  BeautifulMentionsItemsProps,
  BeautifulMentionsMenuItemProps,
  BeautifulMentionsMenuProps,
  BeautifulMentionsPlugin,
  ZeroWidthNode,
  ZeroWidthPlugin,
  convertToMentionNodes,
  useBeautifulMentions,
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
import { usePaletteMode } from "../stores/theme-store";

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

export const mentionStyle = css`
  padding: 0 4px;
  margin: 0 1px;
  vertical-align: baseline;
  display: inline-block;
  border-radius: 4px;
  word-break: break-word;
  user-select: none;
  outline: none;
  line-height: 22px;
  cursor: pointer;
`;

export const mentionStyleFocused = css`
  outline: 2px solid transparent;
  outline-offset: 2px;
  --shadow-color: #111827;
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  box-shadow: var(--shadow, 0 0 #0000), var(--shadow, 0 0 #0000), var(--shadow);
`;

export const taskContextStyle = css`
  color: #fff;
  background-color: #4caf50;
`;
export const taskContextDarkStyle = css`
  color: rgba(0, 0, 0, 0.87);
  background-color: rgb(129, 199, 132);
`;
export const taskProjectStyle = css`
  color: #fff;
  background-color: #03a9f4;
`;
export const taskProjectDarkStyle = css`
  color: rgba(0, 0, 0, 0.87);
  background-color: rgb(79, 195, 247);
`;
export const taskDudDateStyle = css`
  color: #fff;
  background-color: #ff9800;
  white-space: nowrap;
`;
export const taskDudDateDarkStyle = css`
  color: rgba(0, 0, 0, 0.87);
  background-color: rgb(255, 183, 77);
  white-space: nowrap;
`;
export const taskTagStyle = css`
  color: #fff;
  background-color: #858585;
  white-space: nowrap;
`;
export const taskTagDarkStyle = css`
  color: rgba(0, 0, 0, 0.87);
  background-color: #909090;
  white-space: nowrap;
`;
export const menuAnchorStyle = css`
  z-index: 1300;
`;

type Trigger = "@" | "\\+" | "due:" | "\\w+:";

const styleMap: Record<PaletteMode, Record<Trigger, string>> = {
  light: {
    "@": taskContextStyle,
    "\\+": taskProjectStyle,
    "due:": taskDudDateStyle,
    "\\w+:": taskTagStyle,
  },
  dark: {
    "@": taskContextDarkStyle,
    "\\+": taskProjectDarkStyle,
    "due:": taskDudDateDarkStyle,
    "\\w+:": taskTagDarkStyle,
  },
} as const;

function getMentionStyle(themeMode: PaletteMode, trigger: Trigger) {
  return {
    [trigger]: styleMap[themeMode][trigger] + " " + mentionStyle,
    [trigger + "Focused"]: mentionStyleFocused,
  };
}

function useMentionStyles(): Record<string, string> {
  const mode = usePaletteMode();
  return useMemo(
    () => ({
      ...getMentionStyle(mode, "@"),
      ...getMentionStyle(mode, "\\+"),
      ...getMentionStyle(mode, "due:"),
      ...getMentionStyle(mode, "\\w+:"),
    }),
    [mode]
  );
}

const useEditorConfig = (triggers: string[], initialValue: string) => {
  const styles = useMentionStyles();
  return useMemo(
    () => ({
      onError(error: any) {
        console.log(error);
        // throw error;
      },
      editorState: setEditorState(initialValue, triggers),
      // @ts-ignore
      nodes: [BeautifulMentionNode, ZeroWidthNode],
      namespace: "",
      theme: {
        beautifulMentions: styles,
      },
    }),
    [initialValue, styles, triggers]
  );
};

export const useIsFocused = () => {
  const [editor] = useLexicalComposerContext();
  const [hasFocus, setHasFocus] = useState(
    () => editor.getRootElement() === document.activeElement
  );

  useLayoutEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          setHasFocus(true);
          return false;
        },
        COMMAND_PRIORITY_NORMAL
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          setHasFocus(false);
          return false;
        },
        COMMAND_PRIORITY_NORMAL
      )
    );
  }, [editor]);

  return hasFocus;
};

function SingleLinePlugin({ onEnter }: { onEnter?: () => void }) {
  const [editor] = useLexicalComposerContext();
  const { isMentionsMenuOpen } = useBeautifulMentions();
  useEffect(
    () =>
      mergeRegister(
        editor.registerNodeTransform(LineBreakNode, (node) => {
          node.remove();
        }),
        editor.registerCommand(
          KEY_ENTER_COMMAND,
          (event) => {
            const isOpen = isMentionsMenuOpen();
            if (
              event &&
              onEnter &&
              !isOpen &&
              !event.shiftKey &&
              !event.ctrlKey &&
              !event.metaKey
            ) {
              onEnter();
              return true;
            }
            return false;
          },
          COMMAND_PRIORITY_LOW
        )
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, isMentionsMenuOpen]
  );
  return null;
}

function setEditorState(initialValue: string, triggers: string[]) {
  return () => {
    const root = $getRoot();
    if (root.getFirstChild() === null) {
      const paragraph = $createParagraphNode();
      paragraph.append(...convertToMentionNodes(initialValue, triggers));
      root.append(paragraph);
    }
  };
}

const MenuComponent = forwardRef<HTMLUListElement, BeautifulMentionsMenuProps>(
  (props, ref) => {
    const { open, loading, children, ...other } = props;
    return (
      <Fade appear in={open}>
        <Paper elevation={2}>
          <MenuList ref={ref} sx={{ mt: "24px" }} {...other}>
            {children}
          </MenuList>
        </Paper>
      </Fade>
    );
  }
);

const MenuItemComponent = forwardRef<
  HTMLLIElement,
  BeautifulMentionsMenuItemProps
>((props, ref) => {
  return <MenuItem ref={ref} {...props} />;
});

const Legend = styled("legend")`
  user-select: none;
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
    position: "relative",
    userSelect: "auto",
    borderRadius: theme.shape.borderRadius,
    borderWidth: 1,
    minHeight: 65,
    margin: "-2px -1px",
    padding: "7px 14px 14px 15px",
    borderColor: borderColor,
    borderStyle: "solid",
    cursor: "text",
    "@media (hover: hover) and (pointer: fine)": {
      "&:hover": {
        borderColor: theme.palette.text.primary,
      },
    },
  };
});

const Placeholder = styled(Typography)(({ theme }) => ({
  color: theme.palette.action.disabled,
  position: "absolute",
  pointerEvents: "none",
  left: 15,
  top: 7,
  display: "inline-block",
  userSelect: "none",
  overflow: "hidden",
  textOverflow: "ellipsis",
}));

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
  const theme = useTheme();
  const focused = useIsFocused();
  const [editor] = useLexicalComposerContext();

  const handleChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const root = $getRoot();
        onChange(root.getTextContent());
      });
    },
    [onChange]
  );

  const handleClick = useCallback(() => {
    editor.focus();
  }, [editor]);

  return (
    <div style={{ margin: "0 1px" }}>
      <Fieldset
        onClick={handleClick}
        style={{
          ...(focused && {
            borderColor: theme.palette.primary.main,
            borderWidth: 2,
            margin: "-2px",
          }),
        }}
      >
        {label && (
          <Legend
            sx={{
              color: focused ? "primary.main" : "text.secondary",
            }}
          >
            {label}
          </Legend>
        )}
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
        <SingleLinePlugin onEnter={onEnter} />
        <BeautifulMentionsPlugin
          items={items}
          menuComponent={MenuComponent}
          menuItemComponent={MenuItemComponent}
          creatable
          insertOnBlur
          allowSpaces={false}
          menuAnchorClassName={menuAnchorStyle}
        />
      </Fieldset>
    </div>
  );
}
