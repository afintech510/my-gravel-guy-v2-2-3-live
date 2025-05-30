
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, addHours } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface DeliveryDatePickerProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
}

const DeliveryDatePicker = ({ selectedDate, onDateSelect }: DeliveryDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const minDate = addHours(new Date(), 60); // 60 hours minimum lead time

  // Function to disable Sundays and dates before minimum date
  const isDateDisabled = (date: Date) => {
    // Check if date is before minimum date
    if (date < minDate) return true;
    
    // Check if date is Sunday (0 = Sunday)
    if (date.getDay() === 0) return true;
    
    return false;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Delivery Date</label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              onDateSelect(date);
              setIsOpen(false);
            }}
            disabled={isDateDisabled}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      <p className="text-xs text-muted-foreground">
        * Minimum 60-hour lead time required. Sundays unavailable for delivery.
      </p>
    </div>
  );
};

export default DeliveryDatePicker;
