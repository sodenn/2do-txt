import {
  ExpandableSearch,
  ExpandableSearchProps,
} from "@/components/ExpandableSearch";
import { useFilterStore } from "@/stores/filter-store";
import { useHotkeys } from "@/utils/useHotkeys";
import { KeyboardEventHandler, useRef } from "react";

interface SearchBarProps {
  onExpand?: (expanded: boolean) => void;
}

export function SearchBar({ onExpand }: SearchBarProps) {
  const searchTerm = useFilterStore((state) => state.searchTerm);
  const setSearchTerm = useFilterStore((state) => state.setSearchTerm);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown: KeyboardEventHandler = (event) => {
    if (event.key === "Escape") {
      searchInputRef.current?.blur();
    }
  };

  const handleChange: ExpandableSearchProps["onChange"] = (event) => {
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
    <div className="flex flex-1 justify-end">
      <ExpandableSearch
        onExpand={onExpand}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        value={searchTerm}
        ref={searchInputRef}
      />
    </div>
  );
}
