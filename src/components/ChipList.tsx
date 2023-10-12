import { Badge, Chip, ChipProps, styled } from "@mui/joy";

interface ChipListProps {
  items?: Record<string, number>;
  activeItems?: string[];
  multiple?: boolean;
  onClick?: (item: string) => void;
  color?: ChipProps["color"];
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

export function ChipList(props: ChipListProps) {
  const {
    items = {},
    activeItems = [],
    multiple = true,
    onClick,
    color,
  } = props;

  return (
    <List>
      {Object.entries(items).map(([item, usages]) => (
        <li key={item}>
          <Badge
            badgeContent={usages === 1 ? 0 : usages}
            color="primary"
            badgeInset={2}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
          >
            <Chip
              size="lg"
              disabled={
                multiple
                  ? false
                  : activeItems.length > 0 && !activeItems.includes(item)
              }
              variant={activeItems.includes(item) ? "solid" : "outlined"}
              color={color}
              onClick={() => onClick?.(item)}
            >
              {item}
            </Chip>
          </Badge>
        </li>
      ))}
    </List>
  );
}
