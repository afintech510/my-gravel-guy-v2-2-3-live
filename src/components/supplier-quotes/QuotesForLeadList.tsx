import React from 'react';
import { FileText, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SupplierQuote, Lead } from '@/types/supplierQuote.types';
import { format } from 'date-fns';

interface QuotesForLeadListProps {
  lead: Lead | null;
  quotes: SupplierQuote[];
}

export function QuotesForLeadList({ lead, quotes }: QuotesForLeadListProps) {
  if (!lead) {
    return null;
  }

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <FileText className="h-4 w-4" />
        <span className="font-medium truncate">Quotes for {lead.display_name}</span>
      </div>
      
      {quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No quotes for this lead yet.</p>
      ) : (
        <ScrollArea className="max-h-48">
          <div className="space-y-2">
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
                <div className="text-sm text-primary">
                  {quote.price_summary || 'Draft Quote'}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
