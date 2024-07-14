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
import { useTooltip } from "@/utils/useTooltip";
import { CheckIcon, CircleHelpIcon, RefreshCwIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

type Unit = (typeof options)[number]["value"];

function parseValue(value?: string | null) {
  const match = value ? getRecValueMatch(value) : undefined;
  if (match && match.length > 3) {
    return {
      strict: match[1] === "+",
      amount: parseInt(match[2]),
      unit: match[3] as Unit,
    };
  } else {
    return {
      strict: false,
      amount: 1,
      unit: "-" as Unit,
    };
  }
}

export function RecurrencePicker(props: PriorityPickerProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(props.value || null);
  const initialValues = useMemo(
    () => parseValue(props.value),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [strict, setStrict] = useState(initialValues.strict);
  const [unit, setUnit] = useState(initialValues.unit);
  const [amount, setAmount] = useState(initialValues.amount);
  const [unitSelected, setUnitSelected] = useState(false);
  const { t } = useTranslation();
  const { showTooltip, ...triggerProps } = useTooltip();
  const unitLabel = options.find((option) => option.value === unit)?.label;

  useEffect(() => {
    const values = parseValue(props.value);
    setStrict(values.strict);
    setAmount(values.amount);
    setUnit(values.unit);
  }, [props.value]);

  useEffect(() => {
    if (!open && unitSelected) {
      setTimeout(() => setUnitSelected(false), 150);
    }
  }, [open, unitSelected]);

  const handleSelectUnit = (value: string) => {
    const unit = value as Unit;
    setUnit(unit);
    if (unit === "-") {
      setAmount(1);
      setStrict(false);
      handleChange("-", 1, false);
      setOpen(false);
    } else {
      handleChange(unit, amount, strict);
      setUnitSelected(true);
    }
  };

  const handleChangeAmount: InputProps["onChange"] = (event) => {
    const amount = parseInt(event.target.value); // safe parse
    setAmount(amount);
    handleChange(unit, amount || 1, strict);
  };

  const handleBlurAmount: InputProps["onBlur"] = () => {
    setOpen(false);
  };

  const handleChangeStrict = (strict: boolean) => {
    setStrict(strict);
    handleChange(unit, amount, strict);
  };

  const handleChange = (unit: Unit, amount: number, strict: boolean) => {
    if (unit === "-") {
      props.onChange?.(null);
      setValue(null);
    } else {
      const value = (strict ? "+" : "") + amount + unit;
      props.onChange?.(value);
      setValue(value);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <Tooltip open={showTooltip}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant={value ? "secondary" : "ghost"}
              size={value ? "default" : "icon"}
              role="combobox"
              aria-expanded={open}
              className={cn(
                value && "justify-between gap-2",
                !value && "flex-shrink-0 text-muted-foreground",
              )}
              {...triggerProps}
            >
              <RefreshCwIcon className="h-4 w-4" />
              {unitLabel &&
                unitLabel !== "No recurrence" &&
                t(`Every ${unitLabel}`, { count: amount })}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("Recurrence")}</TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-[240px] p-0">
        {!unitSelected && (
          <Command className="outline-none" tabIndex={0}>
            <CommandList>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={handleSelectUnit}
                  >
                    {t(opt.label)}
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        unit === opt.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
        {unitSelected && unitLabel && unitLabel !== "No recurrence" && (
          <div className="flex flex-col gap-3 p-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unit">{t(`Number of ${unitLabel}`)}</Label>
              <Input
                autoFocus
                id="unit"
                type="number"
                min={1}
                value={amount}
                onChange={handleChangeAmount}
                onBlur={handleBlurAmount}
                className="w-full"
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
                className="flex items-center gap-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("Strict recurrence")}
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <CircleHelpIcon className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent asChild>
                    <div>{t("Repeat from due date")}</div>
                  </TooltipContent>
                </Tooltip>
              </label>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
