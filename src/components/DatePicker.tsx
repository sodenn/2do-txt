import { Calendar } from "@/components/ui/calendar";
import { DateInput } from "@/components/ui/date-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { DayPickerSingleProps } from "react-day-picker";

export function DatePicker() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(date);

  const handleClick: DateInput["onClick"] = (event) => {
    event.preventDefault();
    setOpen(true);
  };

  const handleChange: DateInput["onValueChange"] = (newDate) => {
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
        <DateInput
          onClick={handleClick}
          onValueChange={handleChange}
          value={date}
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
