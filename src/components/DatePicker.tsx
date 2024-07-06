import { Calendar } from "@/components/ui/calendar";
import { Input, InputProps } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate, parseDate } from "@/utils/date";
import { useState } from "react";
import { DayPickerSingleProps } from "react-day-picker";

export function DatePicker() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(date);

  const handleClick: InputProps["onClick"] = (event) => {
    event.preventDefault();
    setOpen(true);
  };

  const handleChange: InputProps["onChange"] = (event) => {
    const value = event.target.value;
    const newDate = parseDate(value);
    if (newDate) {
      setDate(newDate);
      setMonth(newDate);
    }
  };

  const handleSelect: DayPickerSingleProps["onSelect"] = (date) => {
    if (date) {
      setDate(date);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          type="date"
          onClick={handleClick}
          onChange={handleChange}
          value={date ? formatDate(date) : undefined}
        />
      </PopoverTrigger>
      <PopoverContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-auto p-0"
        align="start"
      >
        <Calendar
          month={month}
          onMonthChange={setMonth}
          mode="single"
          selected={date}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
