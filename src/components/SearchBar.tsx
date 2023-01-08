import { Box } from "@mui/material";
import { ChangeEvent, useMemo, useState } from "react";
import { useFilter } from "../data/FilterContext";
import { useAddShortcutListener } from "../utils/shortcuts";
import ExpandableSearch from "./ExpandableSearch";

interface SearchBarProps {
  onExpand?: (expanded: boolean) => void;
}

const SearchBar = ({ onExpand }: SearchBarProps) => {
  const { searchTerm, setSearchTerm } = useFilter();
  const [searchInput, setSearchInput] = useState<HTMLInputElement | null>(null);

  const handleKeyDown = (event: any) => {
    if (event.key === "Escape") {
      searchInput?.blur();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const shortcutListeners = useMemo(
    () => ({ f: () => searchInput?.focus() }),
    [searchInput]
  );

  useAddShortcutListener(shortcutListeners);

  return (
    <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
      <ExpandableSearch
        onExpand={onExpand}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        value={searchTerm}
        ref={setSearchInput}
      />
    </Box>
  );
};

export default SearchBar;
