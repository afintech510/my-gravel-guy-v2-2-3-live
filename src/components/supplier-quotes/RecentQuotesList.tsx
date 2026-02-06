import React from 'react';
import { FileText, MapPin, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SupplierQuote } from '@/types/supplierQuote.types';
import { format } from 'date-fns';

interface RecentQuotesListProps {
  quotes: SupplierQuote[];
}

export function RecentQuotesList({ quotes }: RecentQuotesListProps) {
  if (quotes.length === 0) {
    return (
      <Card className="p-4 bg-card border-border h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <FileText className="h-4 w-4" />
          <span className="font-medium">Recent Quotes (All)</span>
        </div>
        <p className="text-sm text-muted-foreground">No quotes yet. Create your first quote above.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card border-border h-[400px]">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <FileText className="h-4 w-4" />
        <span className="font-medium">Recent Quotes (All)</span>
      </div>
      
      <ScrollArea className="h-[340px]">
        <div className="space-y-3">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="p-3 rounded-lg bg-muted border border-border"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground truncate">
                  {quote.supplier_name || 'Unknown Supplier'}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(quote.created_at), 'h:mm a')}
                </span>
              </div>
              
              {quote.material && (
                <div className="text-sm text-muted-foreground mb-1">
                  {quote.material}
                </div>
              )}
              
              <div className="text-sm text-primary font-medium">
                {quote.price_summary || 'Draft Quote'}
              </div>
              
              {quote.delivery_city && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />
                  {quote.delivery_city}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
