import {
  Fade,
  MenuItem,
  MenuList,
  Paper,
  styled,
  useTheme,
} from "@mui/material";
import React, {
  FocusEvent,
  forwardRef,
  ReactNode,
  useCallback,
  useState,
} from "react";
import { ReactEditor } from "slate-react";
import { WithChildren } from "../../types/common";
import { MentionTextFieldProps } from "./mention-types";
import MentionTextField from "./MentionTextField";

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
    userSelect: "auto",
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

interface MuiMentionTextFieldProps extends MentionTextFieldProps {
  label?: ReactNode;
}

const SuggestionList = forwardRef<HTMLDivElement, WithChildren>(
  ({ children }, ref) => (
    <div ref={ref}>
      <Fade in>
        <Paper elevation={2}>
          <MenuList>{children}</MenuList>
        </Paper>
      </Fade>
    </div>
  )
);

const MuiMentionTextField = (props: MuiMentionTextFieldProps) => {
  const { editor, label, onFocus, onBlur } = props;
  const [focus, setFocus] = useState(false);
  const theme = useTheme();

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      setFocus(true);
      if (onFocus) {
        onFocus(event);
      }
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      setFocus(false);
      if (onBlur) {
        onBlur(event);
      }
    },
    [onBlur]
  );

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
      <MentionTextField
        onFocus={handleFocus}
        onBlur={handleBlur}
        suggestionListComponent={SuggestionList}
        suggestionListItemComponent={MenuItem}
        {...props}
      />
    </Fieldset>
  );
};

export default MuiMentionTextField;
