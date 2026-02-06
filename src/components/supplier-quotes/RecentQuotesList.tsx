import React from 'react';
import { FileText, MapPin, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SupplierQuote, calculateQuoteTotals } from '@/types/supplierQuote.types';
import { format } from 'date-fns';

interface RecentQuotesListProps {
  quotes: SupplierQuote[];
  onSelectQuote?: (quoteId: string) => void;
}

export function RecentQuotesList({ quotes, onSelectQuote }: RecentQuotesListProps) {
  if (quotes.length === 0) {
    return (
      <Card className="p-4 bg-card border-border h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <FileText className="h-4 w-4" />
          <span className="font-medium text-foreground">Recent Quotes (All)</span>
        </div>
        <p className="text-sm text-muted-foreground">No quotes yet. Create your first quote above.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card border-border h-[400px]">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <FileText className="h-4 w-4" />
        <span className="font-medium text-foreground">Recent Quotes (All)</span>
      </div>
      
      <ScrollArea className="h-[340px]">
        <div className="space-y-3">
          {quotes.map((quote) => {
            const totals = calculateQuoteTotals(quote);
            const unitLabel = quote.material_unit === 'cy' ? '/cy' : '/ton';
            const unitsLabel = quote.material_unit === 'cy' ? 'cy' : 'tons';
            
            return (
              <button
                key={quote.id}
                onClick={() => onSelectQuote?.(quote.id)}
                className="w-full text-left p-3 rounded-lg bg-muted border border-border hover:bg-muted/80 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-foreground truncate">
                    {quote.supplier_name || 'Unknown Supplier'}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(quote.created_at), 'h:mm a')}
                  </span>
                </div>
                
                {quote.material && (
                  <div className="text-sm text-foreground mb-1">
                    {quote.material}
                  </div>
                )}
                
                {(quote.delivery_city || quote.delivery_state) && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <MapPin className="h-3 w-3" />
                    {[quote.delivery_city, quote.delivery_state].filter(Boolean).join(', ')}
                  </div>
                )}
                
                {/* Pricing breakdown */}
                {totals.totalCost > 0 ? (
                  <div className="text-sm font-semibold text-foreground">
                    ${totals.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • ${totals.pricePerTon.toFixed(2)}{unitLabel} • {totals.totalTons} {unitsLabel}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {quote.price_summary || 'Draft Quote'}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
