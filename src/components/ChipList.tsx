import { Badge, Chip, styled } from "@mui/material";
import { Dictionary } from "../utils/types";

interface ChipListProps {
  list?: Dictionary<number>;
  selected?: string[];
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
  const { list = {}, selected = [], onClick, color } = props;

  return (
    <List>
      {Object.entries(list).map(([item, usages], index) => (
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
              variant={selected.includes(item) ? "filled" : "outlined"}
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
