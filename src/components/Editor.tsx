import { FloatingTextFormatToolbarPlugin } from "@/components/FloatingTextFormatToolbarPlugin";
import { Label } from "@/components/ui/label";
import { HAS_TOUCHSCREEN } from "@/utils/platform";
import { cn } from "@/utils/tw-utils";
import { CodeNode } from "@lexical/code";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
} from "@lexical/markdown";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { mergeRegister } from "@lexical/utils";
import {
  $createTextNode,
  $nodesOfType,
  BLUR_COMMAND,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  EditorState,
  FOCUS_COMMAND,
  KEY_ENTER_COMMAND,
  LineBreakNode,
  ParagraphNode,
} from "lexical";
import {
  $transformTextToMentionNodes,
  BeautifulMentionNode,
  BeautifulMentionsItemsProps,
  BeautifulMentionsMenuItemProps,
  BeautifulMentionsMenuProps,
  BeautifulMentionsPlugin,
  BeautifulMentionsTheme,
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

const TRANSFORMERS = [
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
];

interface EditorContextProps {
  initialValue: string;
  triggers: string[];
  children: React.JSX.Element | string | (React.JSX.Element | string)[];
}

interface EditorProps
  extends Pick<BeautifulMentionsItemsProps, "items">,
    Omit<
      ComponentProps<typeof ContentEditable>,
      "onChange" | "label" | "placeholder"
    > {
  onChange: (value: string) => void;
  onEnter: () => void;
  label?: ReactNode;
  placeholder: string;
}

const mentionsStyle =
  "px-1 mx-2/3 mx-px align-baseline inline-block rounded break-words cursor-pointer leading-5 border";
const mentionsStyleFocused = "shadow";

const beautifulMentionsTheme: BeautifulMentionsTheme = {
  "@": `${mentionsStyle} bg-success/5 dark:bg-success/15 text-success border-success`,
  "@Focused": `${mentionsStyleFocused} shadow-success/30 dark:shadow-success/70`,
  "\\+": `${mentionsStyle} bg-info/5 dark:bg-info/15 text-info border-info`,
  "\\+Focused": `${mentionsStyleFocused} shadow-info/30 dark:shadow-info/70`,
  "due:": `${mentionsStyle} bg-warning/5 dark:bg-warning/15 text-warning border-warning`,
  "due:Focused": `${mentionsStyleFocused} shadow-warning/30 dark:shadow-warning/70`,
  "\\w+:": `${mentionsStyle} bg-primary/5 text-primary border-primary`,
  "\\w+:Focused": `${mentionsStyleFocused} shadow-primary/30 dark:shadow-primary/70`,
};

function useEditorConfig(triggers: string[], initialValue: string) {
  return useMemo(
    () => ({
      onError(error: any) {
        console.log(error);
      },
      editorState: setEditorState(initialValue, triggers),
      nodes: [BeautifulMentionNode, ZeroWidthNode, CodeNode],
      namespace: "",
      theme: {
        beautifulMentions: beautifulMentionsTheme,
        text: {
          code: "rounded bg-accent px-1 mx-1",
          strikethrough: "line-through",
        },
      },
    }),
    [initialValue, triggers],
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

function FixTextFormatPlugin() {
  const [editor] = useLexicalComposerContext();
  useLayoutEffect(
    () =>
      editor.registerUpdateListener(() => {
        editor.update(() => {
          const paragraphs = $nodesOfType(ParagraphNode);
          for (const paragraph of paragraphs) {
            const children = paragraph.getChildren();
            // reset the text formatting if the paragraph is empty
            if (
              children.length === 0 &&
              (paragraph.hasTextFormat("bold") ||
                paragraph.hasTextFormat("strikethrough") ||
                paragraph.hasTextFormat("code") ||
                paragraph.hasTextFormat("italic"))
            ) {
              // reset text formatting
              paragraph.setTextFormat(0);
              // add hack node and remove it again, otherwise the formatting
              // will not be reset:
              const textNode = $createTextNode(" ");
              paragraph.append(textNode);
              setTimeout(() => {
                editor.update(() => {
                  textNode.remove();
                });
              });
            }
          }
        });
      }),
    [editor],
  );
  return null;
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
    $convertFromMarkdownString(initialValue, TRANSFORMERS);
    $transformTextToMentionNodes(triggers);
  };
}

function MenuComponent({ loading, ...other }: BeautifulMentionsMenuProps) {
  return (
    <ul
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
      className="pointer-events-auto absolute top-[2px] m-0 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      {...other}
    />
  );
}

const MenuItemComponent = forwardRef<
  HTMLLIElement,
  BeautifulMentionsMenuItemProps
>(({ selected, item: { value }, itemValue, ...props }, ref) => {
  return (
    <li
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center whitespace-nowrap rounded-sm px-2 py-1.5 text-sm outline-none",
        selected && "bg-accent text-accent-foreground",
      )}
      {...props}
      aria-label={`Choose "${value}"`}
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

export function Editor(props: EditorProps) {
  const {
    label,
    placeholder,
    items,
    onChange,
    onEnter,
    children,
    ...contentEditableProps
  } = props;
  const focused = useIsFocused();
  const [editor] = useLexicalComposerContext();

  const handleChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        onChange(markdown.replaceAll(ZERO_WIDTH_CHARACTER, ""));
      });
    },
    [onChange],
  );

  const handleClick = useCallback(() => {
    editor.focus();
  }, [editor]);

  return (
    <div className="my-1 space-y-2">
      {label && <Label onClick={handleClick}>{label}</Label>}
      <div
        className={cn(
          "text-smx relative mx-auto flex flex-col rounded-md border shadow-sm",
          focused && "ring-1 ring-ring",
        )}
      >
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <FixTextFormatPlugin />
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="relative overflow-auto px-3 py-2 focus:outline-none [&_p]:min-h-[22px]"
              // needed because the cursor keeps blinking in Safari when clicking outside the editor
              onBlur={() => editor.blur()}
              placeholder={
                <div className="pointer-events-none absolute top-0 w-full px-3 py-2 text-muted-foreground">
                  {placeholder}
                </div>
              }
              aria-placeholder={placeholder}
              {...contentEditableProps}
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <FloatingTextFormatToolbarPlugin />
        <OnChangePlugin onChange={handleChange} />
        <HistoryPlugin />
        {!HAS_TOUCHSCREEN && <AutoFocusPlugin defaultSelection="rootEnd" />}
        <ZeroWidthPlugin textContent={ZERO_WIDTH_CHARACTER} />
        <SingleLinePlugin onEnter={onEnter} />
        <BeautifulMentionsPlugin
          items={items}
          menuComponent={MenuComponent}
          menuItemComponent={MenuItemComponent}
          creatable
          insertOnBlur={false}
          allowSpaces={false}
          menuAnchorClassName="z-[1300]"
        />
        <div className="flex flex-wrap gap-1 px-3 py-3">{children}</div>
      </div>
    </div>
  );
}
