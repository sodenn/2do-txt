import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input, InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { getRecValueMatch } from "@/utils/task";
import { cn } from "@/utils/tw-utils";
import { CalendarClockIcon, CheckIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface PriorityPickerProps {
  value?: string | null;
  onChange?: (value: string | null) => void;
}

const options = [
  {
    value: "-",
    label: "No recurrence",
  },
  {
    value: "d",
    label: "Days",
  },
  {
    value: "b",
    label: "Business days",
  },
  {
    value: "w",
    label: "Weeks",
  },
  {
    value: "m",
    label: "Months",
  },
  {
    value: "y",
    label: "Years",
  },
] as const;

export function RecurrencePicker(props: PriorityPickerProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(props.value || null);
  const [strict, setStrict] = useState(false);
  const [unit, setUnit] = useState("-");
  const [amount, setAmount] = useState("1");
  const [unitSelected, setUnitSelected] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const match = props.value ? getRecValueMatch(props.value) : undefined;
    if (match && match.length > 3) {
      setStrict(match[1] === "+");
      setAmount(match[2]);
      setUnit(match[3]);
    } else {
      setStrict(false);
      setAmount("1");
      setUnit("-");
    }
  }, [props.value]);

  useEffect(() => {
    if (!open && unitSelected) {
      setTimeout(() => {
        setUnitSelected(false);
      }, 150);
    }
  }, [open, unitSelected]);

  const handleChangeUnit = (value: string) => {
    setUnit(value || "-");
    if (value === "-") {
      setAmount("1");
      setStrict(false);
      handleChange("-", "1", false);
      setOpen(false);
    } else {
      handleChange(value || "-", amount, strict);
      setUnitSelected(true);
    }
  };

  const handleChangeAmount: InputProps["onChange"] = (event) => {
    const value = event.target.value;
    setAmount(value);
    handleChange(unit, value || "1", strict);
  };

  const handleChangeStrict = (value: boolean) => {
    setStrict(value);
    handleChange(unit, amount, value);
  };

  const handleChange = (unit: string, amount: string, strict: boolean) => {
    if (unit === "-") {
      props.onChange?.(null);
    } else {
      const value = (strict ? "+" : "") + amount + unit;
      props.onChange?.(value);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size={value ? "default" : "icon"}
              role="combobox"
              aria-expanded={open}
              className={cn(value && "justify-between gap-2")}
            >
              <CalendarClockIcon className="h-4 w-4" />
              {/*{t("Recurrence")}*/}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("Recurrence")}</TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-[200px] p-0">
        {!unitSelected && (
          <Command className="outline-none" tabIndex={0}>
            <CommandList>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={handleChangeUnit}
                  >
                    {t(opt.label)}
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === opt.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
        {unitSelected && (
          <div className="p-3 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unit">Anzahl {unit}</Label>
              <Input
                autoFocus
                id="unit"
                type="number"
                min={1}
                value={amount}
                onChange={handleChangeAmount}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="strict"
                checked={strict}
                onCheckedChange={handleChangeStrict}
              />
              <label
                htmlFor="strict"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Strict mode
              </label>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
