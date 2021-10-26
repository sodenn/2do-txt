import Editor from "@draft-js-plugins/editor";
import { Box, Paper, styled, useTheme } from "@mui/material";
import "draft-js/dist/Draft.css";
import React, { createRef, useEffect } from "react";
import { SuggestionData, useTodoEditor } from "./task-editor-hook";

interface TodoEditorProps {
  label?: string;
  value?: string;
  onChange?: (value?: string) => void;
  onEnterPress?: () => void;
  placeholder?: string;
  suggestions: SuggestionData[];
}

const StyledBox = styled(Box)(({ theme }) => {
  const borderColor =
    theme.palette.mode === "light"
      ? "rgba(0, 0, 0, 0.23)"
      : "rgba(255, 255, 255, 0.23)";
  return {
    padding: "16.5px 14px",
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

const Label = styled("label")(() => {
  return {
    fontSize: "0.8em",
    display: "inline-block",
    marginLeft: 10,
    marginBottom: -16,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
});

const TaskEditor = (props: TodoEditorProps) => {
  const theme = useTheme();
  const editorContainerRef = createRef<HTMLDivElement>();
  const {
    value,
    placeholder,
    label,
    onChange,
    onEnterPress,
    suggestions = [],
  } = props;

  const {
    ref,
    focus,
    setFocus,
    editorState,
    setEditorState,
    suggestionData,
    components,
    handlePastedText,
    handleOpenSuggestions,
    handleSearch,
    plugins,
  } = useTodoEditor({
    value,
    suggestions,
    onChange,
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
      {label && (
        <Label>
          <Paper
            elevation={24}
            sx={{
              px: 0.6,
              color: focus ? "primary.main" : "text.secondary",
              boxShadow: "none",
            }}
          >
            {label}
          </Paper>
        </Label>
      )}
      <StyledBox
        ref={editorContainerRef}
        onClick={() => {
          ref.current!.focus();
        }}
        style={
          focus
            ? {
                borderColor: theme.palette.primary.main,
                borderWidth: 2,
                padding: "14px 14px",
              }
            : { padding: "15px 15px" }
        }
      >
        <Editor
          placeholder={placeholder}
          editorKey="editor"
          editorState={editorState}
          onChange={setEditorState}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          handlePastedText={handlePastedText}
          handleReturn={(a, b) => {
            const elem = editorContainerRef.current?.querySelector(
              ".mentionSuggestions"
            );
            if (!elem && onEnterPress && value) {
              onEnterPress();
              return "handled";
            } else {
              return elem ? "not-handled" : "handled";
            }
          }}
          plugins={plugins}
          ref={ref}
        />
        {components.map((item, index) => {
          const { trigger, comp: Comp } = item;
          const data = suggestionData.find((s) => s.trigger === trigger);
          if (data) {
            return (
              <Comp
                key={index}
                open={data.open}
                suggestions={data.suggestions}
                onOpenChange={(open) => handleOpenSuggestions(data, open)}
                onSearchChange={(val) => handleSearch(data, val)}
              />
            );
          } else {
            return null;
          }
        })}
      </StyledBox>
    </div>
  );
};

export default TaskEditor;
