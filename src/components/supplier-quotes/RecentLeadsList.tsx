import React from 'react';
import { Users, Calendar, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lead } from '@/types/supplierQuote.types';
import { format } from 'date-fns';

interface RecentLeadsListProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onSelectLead: (leadId: string) => void;
}

export function RecentLeadsList({ leads, selectedLeadId, onSelectLead }: RecentLeadsListProps) {
  if (leads.length === 0) {
    return (
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <Users className="h-4 w-4" />
          <span className="font-medium text-foreground">Recent Leads</span>
        </div>
        <p className="text-sm text-muted-foreground">No leads yet. Create one using the + button.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <Users className="h-4 w-4" />
        <span className="font-medium text-foreground">Recent Leads</span>
      </div>
      
      <ScrollArea className="max-h-64">
        <div className="space-y-2">
          {leads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => onSelectLead(lead.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedLeadId === lead.id
                  ? 'bg-primary/20 border border-primary/50'
                  : 'bg-muted hover:bg-muted/80 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground truncate">
                  {lead.display_name}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(lead.created_at), 'MM/dd/yyyy')}
                </span>
              </div>
              
              {/* Show city, state */}
              {(lead.job_city || lead.job_state || lead.job_zip) && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <MapPin className="h-3 w-3" />
                  {[lead.job_city, lead.job_state].filter(Boolean).join(', ') || lead.job_zip}
                </div>
              )}
              
              {(lead.material || lead.requested_qty) && (
                <div className="text-xs text-foreground">
                  {lead.material && <span>{lead.material}</span>}
                  {lead.material && lead.requested_qty && <span> • </span>}
                  {lead.requested_qty && (
                    <span>{lead.requested_qty} {lead.requested_unit || 'tons'}</span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
