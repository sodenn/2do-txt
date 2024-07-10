import { Label } from "@/components/ui/label";
import { hasTouchScreen } from "@/native-api/platform";
import { usePlatformStore } from "@/stores/platform-store";
import { cn } from "@/utils/tw-utils";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { mergeRegister } from "@lexical/utils";
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
  BeautifulMentionsTheme,
  ZERO_WIDTH_CHARACTER,
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

const mentionsStyle =
  "px-1 mx-2/3 mx-px align-baseline inline-block rounded break-words cursor-pointer leading-5 border";
const mentionsStyleFocused = "shadow";

const beautifulMentionsTheme: BeautifulMentionsTheme = {
  "@": `${mentionsStyle} bg-success/5 dark:bg-success/15 text-success border-success`,
  "@Focused": `${mentionsStyleFocused} shadow-success/30 dark:shadow-success/60`,
  "\\+": `${mentionsStyle} bg-info/5 dark:bg-info/15 text-info border-info`,
  "\\+Focused": `${mentionsStyleFocused} shadow-info/30 dark:shadow-info/60`,
  "due:": `${mentionsStyle} bg-warning/5 dark:bg-warning/15 text-warning border-warning`,
  "due:Focused": `${mentionsStyleFocused} shadow-warning/30 dark:warning-info/60`,
  "\\w+:": `${mentionsStyle} bg-gray-500/5 dark:bg-gray-400/15 text-gray-500 dark:text-gray-400 border-gray-500 dark:border-gray-400`,
  "\\w+:Focused": `${mentionsStyleFocused} shadow-gray-500/30 dark:shadow-gray-400/60`,
};

function useEditorConfig(triggers: string[], initialValue: string) {
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
        beautifulMentions: beautifulMentionsTheme,
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

function MenuComponent({ loading, ...other }: BeautifulMentionsMenuProps) {
  return (
    <ul
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
      className="absolute top-[2px] z-[1400] m-0 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
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
    children,
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
    <div className="space-y-2">
      {label && <Label onClick={handleClick}>{label}</Label>}
      <div
        className={cn(
          "text-smx relative mx-auto flex flex-col rounded-md border shadow-sm",
          focused && "ring-1 ring-ring",
        )}
      >
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="relative overflow-auto px-3 py-2 focus:outline-none"
              // needed because the cursor keeps blinking in Safari when clicking outside the editor
              onBlur={() => editor.blur()}
              {...contentEditableProps}
            />
          }
          placeholder={
            <div className="pointer-events-none absolute top-0 w-full px-3 py-2 text-muted-foreground">
              {placeholder}
            </div>
          }
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
          menuAnchorClassName="z-[1300]"
        />
        <div className="flex gap-2 px-3 py-3">{children}</div>
      </div>
    </div>
  );
}
