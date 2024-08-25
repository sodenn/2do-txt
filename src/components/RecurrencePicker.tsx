import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
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
import { CircleHelpIcon, RefreshCwIcon } from "lucide-react";
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
  const { t } = useTranslation();
  const { showTooltip, ...triggerProps } = useTooltip();
  const unitLabel = options.find((option) => option.value === unit)?.label;

  useEffect(() => {
    const values = parseValue(props.value);
    setStrict(values.strict);
    setAmount(values.amount);
    setUnit(values.unit);
  }, [props.value]);

  const handleSelectUnit = (value: string) => {
    const newUnit = value as Unit;
    setUnit(newUnit);
    if (newUnit === "-" || unit === newUnit) {
      setAmount(1);
      setStrict(false);
      handleChange("-", 1, false);
      setOpen(false);
    } else {
      handleChange(newUnit, amount, strict);
    }
  };

  const handleChangeAmount: InputProps["onChange"] = (event) => {
    const amount = parseInt(event.target.value); // safe parse
    setAmount(amount);
    handleChange(unit, amount || 1, strict);
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
              aria-label="Recurrence"
              aria-expanded={open}
              className={cn(
                "h-8",
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
      <PopoverContent align="start" className="max-w-sm space-y-3 sm:w-[320px]">
        <ul className="flex flex-wrap gap-1">
          {options.map((opt) => (
            <li className="inline-block" key={opt.value}>
              <Chip
                size="sm"
                onClick={() => handleSelectUnit(opt.value)}
                variant={opt.value === unit ? "default" : "outline"}
              >
                {t(opt.label)}
              </Chip>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col-reverse gap-1.5">
            <Input
              autoFocus
              id="unit"
              type="number"
              min={1}
              value={amount}
              onChange={handleChangeAmount}
              className="peer w-full"
              aria-label="Amount"
              disabled={!unitLabel || unitLabel === "No recurrence"}
            />
            {unitLabel && unitLabel !== "No recurrence" && (
              <Label htmlFor="unit">{t(`Number of ${unitLabel}`)}</Label>
            )}
            {(!unitLabel || unitLabel === "No recurrence") && (
              <Label htmlFor="unit">{t("Recurrence")}</Label>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="strict"
              checked={strict}
              onCheckedChange={handleChangeStrict}
              className="peer"
              disabled={!unitLabel || unitLabel === "No recurrence"}
            />
            <Label htmlFor="strict" className="flex items-center gap-1">
              {t("Strict recurrence")}
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <CircleHelpIcon className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent asChild>
                  <div>{t("Repeat from due date")}</div>
                </TooltipContent>
              </Tooltip>
            </Label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
