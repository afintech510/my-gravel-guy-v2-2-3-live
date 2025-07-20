
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

  useEffect(() => {
    // Load unique sales persons from the database
    const loadSalesPersons = async () => {
      try {
        const uniquePersons = await OrderService.getUniqueSalesPersons();
        setSalesPersons(uniquePersons);
      } catch (error) {
        console.error('Error loading sales persons:', error);
        // Fallback to known persons
        setSalesPersons(['Adam', 'Ronnie']);
      }
    };
    
    if (isEditing) {
      loadSalesPersons();
    }
  }, [isEditing]);

  const handlePersonChange = (newPerson: string) => {
    onPersonUpdate(orderId, newPerson);
    setIsEditing(false);
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
      <Select 
        value={currentPerson || ''} 
        onValueChange={handlePersonChange}
        onOpenChange={(open) => !open && setIsEditing(false)}
        open={true}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Not Assigned</SelectItem>
          {salesPersons.map((person) => (
            <SelectItem key={person} value={person}>
              {person}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Badge 
      className="cursor-pointer bg-gray-100 text-gray-800 hover:bg-gray-200"
      onClick={() => setIsEditing(true)}
    >
      {currentPerson || 'Not Assigned'}
    </Badge>
  );
};

export default SalesPersonSelector;
