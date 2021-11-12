import { Badge, Box, Chip } from "@mui/material";
import React from "react";
import { Dictionary } from "../utils/types";

interface ChipListProps {
  list?: Dictionary<number>;
  selected?: string[];
  onClick?: (item: string) => void;
  color?: "info" | "success" | "warning" | "secondary";
}

const ChipList = ({
  list = {},
  selected = [],
  onClick,
  color,
}: ChipListProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        listStyle: "none",
        p: 0,
        m: 0,
      }}
      component="ul"
    >
      {Object.entries(list).map(([item, usages], index) => {
        return (
          <Box sx={{ mr: 1, mb: 0.5 }} component="li" key={index}>
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
          </Box>
        );
      })}
    </Box>
  );
};

export default ChipList;
