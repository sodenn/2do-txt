import { cn } from "@/utils/tw-utils";
import {
  forwardRef,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";

type Unit = "year" | "month" | "day" | "literal";

interface DateSegmentOptions {
  value?: number;
  min?: number;
  max?: number;
  initialValue?: number;
  onValueChange?: (unit: string, value?: number) => void;
  disabled?: boolean;
  unit: Unit;
  id: string;
}

export interface DateInput extends HTMLAttributes<HTMLDivElement> {
  value?: Date;
  onValueChange?: (date?: Date) => void;
  locale?: string;
  placeholders?: Placeholders;
  icon?: ReactNode;
}

interface DateSegmentProps
  extends DateSegmentOptions,
    Omit<HTMLAttributes<HTMLDivElement>, "id"> {
  placeholder?: ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
}

type Placeholders = Record<Partial<Exclude<Unit, "literal">>, string>;

const placeholdersEn: Placeholders = {
  year: "yyyy",
  month: "mm",
  day: "dd",
};

const placeholdersDe: Placeholders = {
  year: "JJJJ",
  month: "MM",
  day: "TT",
};

function getDefaultPlaceholders(locale: string) {
  if (locale.startsWith("de")) {
    return placeholdersDe;
  }
  return placeholdersEn;
}

export const DateInput = forwardRef<HTMLDivElement, DateInput>(
  (
    {
      children,
      icon: Icon,
      onValueChange,
      locale = navigator.language,
      ...props
    },
    ref,
  ) => {
    const [date, setDate] = useState(props.value);
    const [value, setValue] = useState<
      Record<Exclude<Unit, "literal">, number | undefined>
    >({
      year: date?.getFullYear(),
      month: date?.getMonth(),
      day: date?.getDate(),
    });
    const id = useId();
    const segments = useMemo(() => getSegments(locale, date), [locale, date]);
    const placeholders = props.placeholders || getDefaultPlaceholders(locale);
    const [focus, setFocus] = useState(false);

    const handleFocus = () => {
      setFocus(true);
    };

    const handleBlur = () => {
      setFocus(false);
    };

    const handleValueChange = (unit: string, value?: number) => {
      setValue((prevState) => ({
        ...prevState,
        [unit]: value,
      }));
    };

    useEffect(() => {
      setValue({
        year: props.value?.getFullYear(),
        month: props.value?.getMonth(),
        day: props.value?.getDate(),
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.value?.toLocaleDateString("en-US")]);

    useEffect(() => {
      if (
        typeof value.year === "number" &&
        typeof value.month === "number" &&
        typeof value.day === "number"
      ) {
        const year = value.year.toString().padStart(4, "0");
        const month = (value.month + 1).toString().padStart(2, "0");
        const day = value.day.toString().padStart(2, "0");
        const newDate = new Date(`${year}-${month}-${day}`);
        // @ts-ignore
        if (!isNaN(newDate)) {
          setDate(newDate);
          onValueChange?.(newDate);
        }
      }
      if (
        typeof value.year === "undefined" &&
        typeof value.month === "undefined" &&
        typeof value.day === "undefined"
      ) {
        onValueChange?.(undefined);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(value)]);

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          focus && "ring-1 ring-ring",
        )}
        {...props}
      >
        {Icon && <div className="mr-2 flex items-center">{Icon}</div>}
        {segments.map(({ initialValue, min, max, value, unit, key }) =>
          unit === "literal" ? (
            <Literal value={value as string} key={key} />
          ) : (
            <DateSegment
              key={key}
              unit={unit}
              value={value as number}
              placeholder={placeholders[unit]}
              initialValue={initialValue}
              min={min}
              max={max}
              id={id}
              onValueChange={handleValueChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          ),
        )}
      </div>
    );
  },
);

function Literal({ value }: { value: string }) {
  return (
    <div className="flex flex-col justify-center px-[1px] text-muted-foreground">
      {value}
    </div>
  );
}

const DateSegment = forwardRef<HTMLDivElement, DateSegmentProps>(
  ({ placeholder, id, onFocus, onBlur, ...props }, ref) => {
    const { value, ...divProps } = useDateSegment({ ...props, id });
    return (
      <div ref={ref} className="flex flex-col justify-center">
        <div
          {...divProps}
          onFocus={onFocus}
          onBlur={onBlur}
          className={cn(
            "rounded px-0.5 text-end tabular-nums focus:bg-primary focus:text-primary-foreground focus:caret-transparent focus:outline-none",
            !value && "text-muted-foreground",
          )}
          data-dateinput={id}
        >
          {value}
          {typeof value === "undefined" && placeholder && placeholder}
        </div>
      </div>
    );
  },
);

function getSegments(locale: string, date?: Date) {
  const now = new Date();

  const year = {
    value: date?.getFullYear(),
    initialValue: now.getFullYear(),
    max: 9999,
    min: 1,
  } as const;

  const month = {
    value: date ? date.getMonth() + 1 : undefined, // getMonth() returns 0-based month, so we add 1
    initialValue: now.getMonth() + 1,
    max: 12,
    min: 1,
  } as const;

  const day = {
    value: date?.getDate(),
    initialValue: now.getDate(),
    max:
      year.value && month.value
        ? new Date(year.value, month.value, 0).getDate() // Get the number of days in the current month
        : 31,
    min: 1,
  } as const;

  const literal = {
    initialValue: undefined,
    max: undefined,
    min: undefined,
  } as const;

  const props = {
    year,
    month,
    day,
    literal,
  } as const;

  const dtf = new Intl.DateTimeFormat(locale);
  const parts = dtf.formatToParts(new Date());

  return parts.map((p, idx) => ({
    unit: p.type as Unit,
    key: idx,
    value: p.value,
    ...props[p.type as Unit],
  }));
}

export function useDateSegment(opt: DateSegmentOptions & { id: string }) {
  const [value, setValue] = useState(
    typeof opt.value === "number" ? opt.value : undefined,
  );
  const [dirty, setDirty] = useState(false);
  const isEditable = !opt.disabled;

  const handleIncrement = () => {
    if (
      typeof value === "number" &&
      typeof opt.max === "number" &&
      value + 1 > opt.max
    ) {
      return typeof opt.min === "number" ? opt.min : value;
    }
    if (typeof value === "number") {
      return value + 1;
    }
    if (typeof value === "undefined") {
      return typeof opt.initialValue === "number"
        ? opt.initialValue
        : typeof opt.min === "number"
          ? opt.min
          : value;
    }
    return value;
  };

  const handleDecrement = () => {
    if (
      typeof value === "number" &&
      typeof opt.min === "number" &&
      value - 1 < opt.min
    ) {
      return typeof opt.max === "number" ? opt.max : value;
    }
    if (typeof value === "number") {
      return value - 1;
    }
    if (typeof value === "undefined") {
      return typeof opt.initialValue === "number"
        ? opt.initialValue
        : typeof opt.max === "number"
          ? opt.max
          : value;
    }
    return value;
  };

  const focusNext = () => {
    const currentElement = document.activeElement;
    const allElements = document.querySelectorAll<HTMLDivElement>(
      `[data-dateinput="${opt.id}"]`,
    );
    const index = Array.prototype.indexOf.call(allElements, currentElement);
    if (index !== -1 && index < allElements.length - 1) {
      allElements[index + 1].focus();
    }
  };

  const focusPrevious = () => {
    const currentElement = document.activeElement;
    const allElements = document.querySelectorAll<HTMLDivElement>(
      `[data-dateinput="${opt.id}"]`,
    );
    const index = Array.prototype.indexOf.call(allElements, currentElement);
    if (index - 1 >= 0) {
      allElements[index - 1].focus();
    }
  };

  const handleKey = (key: string) => {
    if (!dirty) {
      return parseInt(key);
    }

    const newValue =
      typeof value === "number" ? parseInt(value + key) : parseInt(key);

    const newValueExceeded =
      typeof opt.max === "number" &&
      newValue.toString().length >= opt.max.toString().length;
    if (newValueExceeded) {
      focusNext();
    }

    if (
      (typeof opt.min === "undefined" || newValue >= opt.min) &&
      (typeof opt.max === "undefined" || newValue <= opt.max)
    ) {
      return newValue;
    }

    return value;
  };

  const handleBackspace = () => {
    const section =
      typeof value === "number" ? value.toString().slice(0, -1) : undefined;
    if (!value) {
      focusPrevious();
    }
    return section ? parseInt(section) : undefined;
  };

  const handleDelete = () => {
    const section =
      typeof value === "number" ? value.toString().slice(1) : undefined;
    if (!section) {
      focusPrevious();
    }
    return section ? parseInt(section) : undefined;
  };

  const onKeyDown: DateSegmentProps["onKeyDown"] = (event) => {
    event.preventDefault();
    const key = event.key;
    let newValue = value;
    if (key === "ArrowUp") {
      newValue = handleIncrement();
    }
    if (key === "ArrowDown") {
      newValue = handleDecrement();
    }
    if (key === "ArrowLeft") {
      focusPrevious();
    }
    if (key === "ArrowRight") {
      focusNext();
    }
    if (key === "Backspace") {
      newValue = handleBackspace();
    }
    if (key === "Delete") {
      newValue = handleDelete();
    }
    if (/\d/.test(key)) {
      newValue = handleKey(event.key);
    }
    if (newValue !== value) {
      setValue(newValue);
      opt.onValueChange?.(opt.unit, newValue);
      setDirty(true);
    }
  };

  const onFocus = () => {
    setDirty(false);
  };

  useEffect(() => {
    setValue(opt.value);
  }, [opt.value]);

  return {
    value,
    onKeyDown,
    onFocus,
    "aria-readonly": !isEditable,
    "aria-valuemin": opt.min,
    "aria-valuemax": opt.max,
    "aria-label": opt.unit,
    tabIndex: !isEditable ? undefined : 1,
    contentEditable: isEditable,
    suppressContentEditableWarning: isEditable,
    spellCheck: isEditable ? "false" : undefined,
    role: "spinbutton",
    autoCapitalize: isEditable ? "off" : undefined,
    autoCorrect: isEditable ? "off" : undefined,
    enterKeyHint: isEditable ? "next" : undefined,
    inputMode: "numeric",
    onPointerDown(e: MouseEvent<HTMLDivElement>) {
      e.stopPropagation();
    },
    onMouseDown(e: MouseEvent<HTMLDivElement>) {
      e.stopPropagation();
    },
  } as const;
}
