import { Box } from "@mui/material";
import { ChangeEvent, useMemo, useRef } from "react";
import useFilterStore from "../stores/filter-store";
import { useHotkeys } from "../utils/useHotkeys";
import ExpandableSearch from "./ExpandableSearch";

interface SearchBarProps {
  onExpand?: (expanded: boolean) => void;
}

const SearchBar = ({ onExpand }: SearchBarProps) => {
  const searchTerm = useFilterStore((state) => state.searchTerm);
  const setSearchTerm = useFilterStore((state) => state.setSearchTerm);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (event: any) => {
    if (event.key === "Escape") {
      searchInputRef.current?.blur();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const hotkeys = useMemo(
    () => ({ f: () => searchInputRef.current?.focus() }),
    [],
  );

  useHotkeys(hotkeys);

  return (
    <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
      <ExpandableSearch
        onExpand={onExpand}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        value={searchTerm}
        ref={searchInputRef}
      />
    </Box>
  );
};

export default SearchBar;
