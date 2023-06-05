import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
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
  Paper,
  Typography,
  styled,
  useTheme,
} from "@mui/material";
import {
  $createParagraphNode,
  $getRoot,
  BLUR_COMMAND,
  COMMAND_PRIORITY_NORMAL,
  EditorState,
  FOCUS_COMMAND,
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
} from "lexical-beautiful-mentions";
import React, {
  ReactNode,
  forwardRef,
  useCallback,
  useLayoutEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

interface EditorContextProps {
  initialValue: string;
  triggers: string[];
  children: React.JSX.Element | string | (React.JSX.Element | string)[];
}

interface EditorProps extends Pick<BeautifulMentionsItemsProps, "items"> {
  onChange: (value: string) => void;
  label?: ReactNode;
}

const mentionsStyle =
  "px-1 mx-px align-baseline inline-block rounded break-words cursor-pointer select-none leading-5";
const mentionsStyleFocused = "outline-none shadow-md shadow-gray-900";

const theme = {
  ltr: "text-left",
  rtl: "text-right",
  beautifulMentions: {
    "@": `${mentionsStyle} bg-green-500 text-gray-950`,
    "@Focused": mentionsStyleFocused,
    "#": `${mentionsStyle} bg-blue-400 text-gray-950`,
    "#Focused": mentionsStyleFocused,
    "due:": `${mentionsStyle} bg-yellow-400 text-gray-950`,
    "due:Focused": mentionsStyleFocused,
  },
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

const editorConfig = (
  triggers: string[],
  initialValue: string
): InitialConfigType => ({
  namespace: "",
  theme,
  onError(error: any) {
    throw error;
  },
  editorState: setEditorState(initialValue, triggers),
  // @ts-ignore
  nodes: [BeautifulMentionNode, ZeroWidthNode],
});

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
    userSelect: "auto",
    margin: 0,
    borderRadius: theme.shape.borderRadius,
    borderWidth: 1,
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

const Placeholder = forwardRef<HTMLSpanElement>((_, ref) => {
  const { t } = useTranslation();
  return (
    <Typography
      sx={{
        color: "action.disabled",
        position: "absolute",
        pointerEvents: "none",
        left: 15,
        top: 7,
        display: "inline-block",
        userSelect: "none",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
      ref={ref}
    >
      {t("Enter text and tags")}
    </Typography>
  );
});

export function EditorContext({
  initialValue,
  triggers,
  children,
}: EditorContextProps) {
  const initialConfig = editorConfig(triggers, initialValue);
  return (
    <LexicalComposer initialConfig={initialConfig}>{children}</LexicalComposer>
  );
}

export function Editor(props: EditorProps) {
  const { label, items, onChange } = props;
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
    <Fieldset
      onClick={handleClick}
      style={
        focused
          ? {
              position: "relative",
              borderColor: theme.palette.primary.main,
              borderWidth: 2,
              padding: "7px 13px 13px 14px",
            }
          : { position: "relative", padding: "7px 14px 14px 15px" }
      }
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
              //padding: `${theme.spacing(4)} ${theme.spacing(3)}`,
              outline: "none",
            }}
          />
        }
        placeholder={<Placeholder />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <OnChangePlugin onChange={handleChange} />
      <HistoryPlugin />
      <AutoFocusPlugin defaultSelection="rootEnd" />
      <ZeroWidthPlugin />
      <BeautifulMentionsPlugin
        items={items}
        menuComponent={MenuComponent}
        menuItemComponent={MenuItemComponent}
        creatable
        insertOnBlur
      />
    </Fieldset>
  );
}
