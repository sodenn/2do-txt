import { styled } from "@mui/material";
import { RenderElementProps, useFocused, useSelected } from "slate-react";
import { isMentionElement } from "./mention-utils";

const Span = styled("span")<{ selected: number; focused: number }>(
  ({ theme, selected, focused }) => ({
    padding: "1px 4px 2px",
    margin: "0 1px",
    verticalAlign: "baseline",
    display: "inline-block",
    borderRadius: theme.spacing(1),
    backgroundColor: "#eee",
    wordBreak: "break-word",
    boxShadow: selected && focused ? theme.shadows[1] : "none",
    cursor: "pointer",
  })
);

const Mention = ({ attributes, children, element }: RenderElementProps) => {
  const selected = useSelected();
  const focused = useFocused();

  if (!isMentionElement(element)) {
    return null;
  }

  return (
    <Span
      {...attributes}
      style={element.style}
      contentEditable={false}
      selected={selected ? 1 : 0}
      focused={focused ? 1 : 0}
      data-testid={`mention-${element.value.replace(" ", "-")}`}
    >
      {element.trigger}
      {element.value}
      {children}
    </Span>
  );
};

const Element = (props: RenderElementProps) => {
  const { attributes, children, element } = props;
  switch (element.type) {
    case "mention":
      return (
        <Mention attributes={attributes} element={element}>
          {children}
        </Mention>
      );
    default:
      return (
        <p style={{ margin: 0, padding: 0, minHeight: 27 }} {...attributes}>
          {children}
        </p>
      );
  }
};

export default Element;
