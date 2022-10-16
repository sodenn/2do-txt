import { Badge, Chip, styled } from "@mui/material";

interface ChipListProps {
  items?: Record<string, number>;
  activeItems?: string[];
  multiple?: boolean;
  onClick?: (item: string) => void;
  color?: "info" | "success" | "warning" | "secondary";
}

const List = styled("ul")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  rowGap: theme.spacing(1.5),
  columnGap: theme.spacing(1),
  listStyle: "none",
  padding: 0,
  margin: 0,
}));

const ChipList = (props: ChipListProps) => {
  const {
    items = {},
    activeItems = [],
    multiple = true,
    onClick,
    color,
  } = props;

  return (
    <List>
      {Object.entries(items).map(([item, usages], index) => (
        <li key={index}>
          <Badge
            badgeContent={usages === 1 ? undefined : usages}
            color="primary"
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
          >
            <Chip
              sx={{ px: 1 }}
              disabled={
                multiple
                  ? false
                  : activeItems.length > 0 && !activeItems.includes(item)
              }
              variant={activeItems.includes(item) ? "filled" : "outlined"}
              label={item}
              color={color}
              onClick={() => onClick?.(item)}
              aria-label={`${item} is used ${usages} times`}
            />
          </Badge>
        </li>
      ))}
    </List>
  );
};

export default ChipList;
