import { Badge, Chip, styled } from "@mui/material";
import { Dictionary } from "../types/common";

interface ChipListProps {
  items?: Dictionary<number>;
  activeItems?: string[];
  multiple?: boolean;
  onClick?: (item: string) => void;
  color?: "info" | "success" | "warning" | "secondary";
}

const List = styled("ul")`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  row-gap: ${({ theme }) => theme.spacing(1.5)};
  column-gap: ${({ theme }) => theme.spacing(1)};
  list-style: none;
  padding: 0;
  margin: 0;
`;

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
            aria-label={`${item} is used ${usages} times`}
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
              onClick={() => onClick && onClick(item)}
            />
          </Badge>
        </li>
      ))}
    </List>
  );
};

export default ChipList;
