import { Box } from "@mui/material";
import { ChangeEvent, useMemo, useRef } from "react";
import useFilter from "../data/filter-store";
import { useAddShortcutListener } from "../utils/shortcuts";
import ExpandableSearch from "./ExpandableSearch";

interface SearchBarProps {
  onExpand?: (expanded: boolean) => void;
}

const SearchBar = ({ onExpand }: SearchBarProps) => {
  const searchTerm = useFilter((state) => state.searchTerm);
  const setSearchTerm = useFilter((state) => state.setSearchTerm);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (event: any) => {
    if (event.key === "Escape") {
      searchInputRef.current?.blur();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const shortcutListeners = useMemo(
    () => ({ f: () => searchInputRef.current?.focus() }),
    []
  );

  useAddShortcutListener(shortcutListeners);

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
