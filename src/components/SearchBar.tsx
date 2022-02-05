import { ChangeEvent, useRef } from "react";
import { useFilter } from "../data/FilterContext";
import { useAddShortcutListener } from "../utils/shortcuts";
import ExpandableSearch from "./ExpandableSearch";

interface SearchBarProps {
  onExpand?: (expanded: boolean) => void;
}

const SearchBar = ({ onExpand }: SearchBarProps) => {
  const { searchTerm, setSearchTerm } = useFilter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useAddShortcutListener(
    () => {
      searchInputRef.current?.focus();
    },
    "f",
    [searchInputRef.current]
  );

  const handleKeyDown = (event: any) => {
    if (event.key === "Escape") {
      searchInputRef.current?.blur();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <ExpandableSearch
      onExpand={onExpand}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      value={searchTerm}
      ref={searchInputRef}
    />
  );
};

export default SearchBar;
