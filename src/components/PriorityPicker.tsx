import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/tw-utils";
import { useTooltip } from "@/utils/useTooltip";
import { CheckIcon, FlagIcon } from "lucide-react";
import { KeyboardEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const options = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

interface PriorityPickerProps {
  value?: string;
  onChange?: (value?: string) => void;
}

export function PriorityPicker(props: PriorityPickerProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(props.value || null);
  const { showTooltip, ...triggerProps } = useTooltip();
  const { t } = useTranslation();

  const handleSelect = (selectedValue: string | null) => {
    const newValue = selectedValue === value ? null : selectedValue;
    props.onChange?.(newValue || undefined);
    setValue(newValue);
    setOpen(false);
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    const value = options.includes(event.key.toUpperCase())
      ? event.key.toUpperCase()
      : undefined;
    if (value) {
      props.onChange?.(value);
      setValue(value);
      setOpen(false);
    }
  };

  useEffect(() => {
    setValue(props.value || null);
  }, [props.value]);

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <Tooltip open={showTooltip}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant={value ? "secondary" : "ghost"}
              size={value ? "default" : "icon"}
              role="combobox"
              aria-expanded={open}
              aria-label="Priority"
              className={cn(
                "h-8",
                value && "justify-between gap-2",
                !value && "text-muted-foreground shrink-0",
              )}
              {...triggerProps}
            >
              <FlagIcon className="h-4 w-4" />
              {value && options.find((opt) => opt === value)}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("Priority")}</TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-[170px] p-0">
        <Command>
          <CommandInput
            aria-label="Select task priority"
            placeholder={t("Select priority")}
            className="h-9"
            onKeyUp={handleKeyUp}
          />
          <CommandList>
            <CommandEmpty>{t("No priority found")}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem key={opt} value={opt} onSelect={handleSelect}>
                  {opt}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === opt ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
