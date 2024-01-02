import { ExpandableSearch } from "@/components/ExpandableSearch";
import { useFilterStore } from "@/stores/filter-store";
import { useHotkeys } from "@/utils/useHotkeys";
import { Box } from "@mui/joy";
import { ChangeEvent, useRef } from "react";

interface SearchBarProps {
  onExpand?: (expanded: boolean) => void;
}

export function SearchBar({ onExpand }: SearchBarProps) {
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

  useHotkeys({
    f: (event) => {
      event.preventDefault();
      setTimeout(() => {
        searchInputRef.current?.focus();
      });
    },
  });

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
}
