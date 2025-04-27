
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, addBusinessDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface DeliveryDatePickerProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
}

const DeliveryDatePicker = ({ selectedDate, onDateSelect }: DeliveryDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const minDate = addBusinessDays(new Date(), 3); // 72hr minimum lead time

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
            disabled={(date) => date < minDate}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      <p className="text-xs text-muted-foreground">
        * Minimum 72-hour lead time required for delivery
      </p>
    </div>
  );
};

export default DeliveryDatePicker;
