import { Badge, Chip, ChipProps, styled } from "@mui/joy";

interface ChipListProps {
  items?: Record<string, number>;
  activeItems?: string[];
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
  const { items = {}, activeItems = [], onClick, color } = props;

  return (
    <List>
      {Object.entries(items).map(([item, usages]) => (
        <li key={item}>
          <Badge
            size="sm"
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
