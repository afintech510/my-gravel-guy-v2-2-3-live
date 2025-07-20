
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { OrderService } from '@/services/orderService';

interface SalesPersonSelectorProps {
  currentPerson: string | null;
  orderId: string;
  onPersonUpdate: (orderId: string, newPerson: string) => void;
  readonly?: boolean;
}

const SalesPersonSelector: React.FC<SalesPersonSelectorProps> = ({
  currentPerson,
  orderId,
  onPersonUpdate,
  readonly = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [salesPersons, setSalesPersons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load unique sales persons from the database when editing starts
    const loadSalesPersons = async () => {
      if (!isEditing) return;
      
      setIsLoading(true);
      try {
        const uniquePersons = await OrderService.getUniqueSalesPersons();
        setSalesPersons(uniquePersons);
      } catch (error) {
        console.error('Error loading sales persons:', error);
        // Fallback to known persons
        setSalesPersons(['Adam', 'Ronnie']);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSalesPersons();
  }, [isEditing]);

  const handlePersonChange = (newPerson: string) => {
    onPersonUpdate(orderId, newPerson);
    setIsEditing(false);
  };

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!readonly) {
      setIsEditing(true);
    }
  };

  if (readonly) {
    return (
      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
        {currentPerson || 'Not Assigned'}
      </Badge>
    );
  }

  if (isEditing) {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Select 
          value={currentPerson || ''} 
          onValueChange={handlePersonChange}
          onOpenChange={(open) => {
            if (!open) {
              setIsEditing(false);
            }
          }}
          open={true}
        >
          <SelectTrigger className="w-32 h-7 text-xs z-50">
            <SelectValue placeholder={isLoading ? "Loading..." : "Select..."} />
          </SelectTrigger>
          <SelectContent className="z-50 bg-white border shadow-lg">
            <SelectItem value="">Not Assigned</SelectItem>
            {salesPersons.map((person) => (
              <SelectItem key={person} value={person}>
                {person}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <Badge 
      className="cursor-pointer bg-gray-100 text-gray-800 hover:bg-gray-200 select-none"
      onClick={handleBadgeClick}
    >
      {currentPerson || 'Not Assigned'}
    </Badge>
  );
};

export default SalesPersonSelector;
