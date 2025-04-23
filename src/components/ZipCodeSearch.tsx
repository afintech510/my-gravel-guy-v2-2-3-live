
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const ZipCodeSearch = () => {
  const [zipCode, setZipCode] = useState('');
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (zipCode.length !== 5) {
      toast({
        title: "Invalid ZIP Code",
        description: "Please enter a valid 5-digit ZIP code",
        variant: "destructive",
      });
      return;
    }
    // In MVP, we'll just show a success message
    toast({
      title: "Service Available!",
      description: "We deliver to your area. Browse our products below.",
    });
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-md mx-auto flex gap-2">
      <Input
        type="text"
        placeholder="Enter ZIP Code"
        value={zipCode}
        onChange={(e) => setZipCode(e.target.value)}
        className="flex-grow"
        maxLength={5}
      />
      <Button type="submit">Check Availability</Button>
    </form>
  );
};

export default ZipCodeSearch;
