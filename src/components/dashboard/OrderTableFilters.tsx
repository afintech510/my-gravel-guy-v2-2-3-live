
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { OrderFilters, FulfillmentStatus } from '@/types/order.types';

interface OrderTableFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  dateRange: { from: Date | undefined, to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined, to: Date | undefined }) => void;
}

const OrderTableFilters: React.FC<OrderTableFiltersProps> = ({
  filters,
  onFiltersChange,
  dateRange,
  onDateRangeChange
}) => {
  
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchTerm: value });
  };

  const handleFulfillmentStatusChange = (value: string) => {
    onFiltersChange({ ...filters, fulfillmentStatus: value as FulfillmentStatus | 'all' });
  };

  const handleSortChange = (value: string) => {
    onFiltersChange({ ...filters, sortBy: value as any });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: '',
      fulfillmentStatus: 'all',
      sortBy: 'date_desc'
    });
    onDateRangeChange({ from: undefined, to: undefined });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-semibold">Filters</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Order ID, name, email, phone..."
              value={filters.searchTerm || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Fulfillment Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Fulfillment Status</label>
          <Select value={filters.fulfillmentStatus || 'all'} onValueChange={handleFulfillmentStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Quote Needed">Quote Needed</SelectItem>
              <SelectItem value="Quote Sent">Quote Sent</SelectItem>
              <SelectItem value="New Order">New Order</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Assigned">Assigned</SelectItem>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
              <SelectItem value="Refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Sort By</label>
          <Select value={filters.sortBy || 'date_desc'} onValueChange={handleSortChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest First</SelectItem>
              <SelectItem value="date_asc">Oldest First</SelectItem>
              <SelectItem value="amount_desc">Highest Amount</SelectItem>
              <SelectItem value="amount_asc">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Delivery Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => onDateRangeChange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Clear Filters */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={clearFilters}>
          Clear All Filters
        </Button>
      </div>
    </div>
  );
};

export default OrderTableFilters;
