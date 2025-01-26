import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { forwardRef, InputHTMLAttributes, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onReset?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (props, ref) => {
    const { value, onReset, onChange, ...rest } = props;
    const { t } = useTranslation();

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        (event.target as HTMLInputElement).blur();
      }
    };

    return (
      <div className="relative ml-0 w-full rounded-md sm:ml-1 sm:w-auto">
        <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
        <Input
          value={value}
          onKeyDown={handleKeyDown}
          onChange={onChange}
          className="bg-background transition-width w-full pl-8 duration-300 ease-in-out sm:w-56 sm:focus:w-72"
          placeholder={t("Search…")}
          aria-label="Search for tasks"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          tabIndex={-1}
          role="search"
          type="search"
          ref={ref}
          {...rest}
        />
      </div>
    );
  },
);
