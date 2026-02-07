import React from "react";
import { Users, Calendar, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "@/types/supplierQuote.types";
import { format, subDays } from "date-fns";

interface RecentLeadsListProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onSelectLead: (leadId: string) => void;
}

export function RecentLeadsList({ leads, selectedLeadId, onSelectLead }: RecentLeadsListProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [dateRangeDays, setDateRangeDays] = React.useState(30);

  const filteredLeads = React.useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const rangeStart = subDays(new Date(), dateRangeDays);

    return leads.filter((lead) => {
      const createdAt = new Date(lead.created_at);
      if (Number.isNaN(createdAt.getTime())) {
        return false;
      }

      const inDateRange = createdAt >= rangeStart;
      if (!inDateRange) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableFields = [lead.display_name, lead.material, lead.job_city, lead.job_state, lead.job_zip]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableFields.includes(normalizedSearch);
    });
  }, [dateRangeDays, leads, searchTerm]);

  if (leads.length === 0) {
    return (
      <Card className="p-4 bg-card border-border flex flex-col">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <Users className="h-4 w-4" />
          <span className="font-medium text-foreground">Recent Leads</span>
        </div>
        <p className="text-sm text-muted-foreground">No leads yet. Create one using the + button.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card border-border flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 text-muted-foreground mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="font-medium text-foreground">Recent Leads</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search leads"
            className="h-8 w-full sm:w-44 text-xs"
          />
          <select
            value={dateRangeDays}
            onChange={(event) => setDateRangeDays(Number(event.target.value))}
            className="h-8 w-full sm:w-auto rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value={7}>Last 7 days</option>
            <option value={15}>Last 15 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 max-h-72">
        <div className="space-y-2">
          {filteredLeads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => onSelectLead(lead.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedLeadId === lead.id
                  ? "bg-primary/20 border border-primary/50"
                  : "bg-muted hover:bg-muted/80 border border-transparent"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground truncate">{lead.display_name}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(lead.created_at), "MM/dd/yyyy")}
                </span>
              </div>

              {/* Show city, state */}
              {(lead.job_city || lead.job_state || lead.job_zip) && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <MapPin className="h-3 w-3" />
                  {[lead.job_city, lead.job_state].filter(Boolean).join(", ") || lead.job_zip}
                </div>
              )}

              {(lead.material || lead.requested_qty) && (
                <div className="text-xs text-foreground">
                  {lead.material && <span>{lead.material}</span>}
                  {lead.material && lead.requested_qty && <span> • </span>}
                  {lead.requested_qty && (
                    <span>
                      {lead.requested_qty} {lead.requested_unit || "tons"}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
          {filteredLeads.length === 0 && (
            <div className="rounded-lg border border-dashed border-muted-foreground/40 p-3 text-xs text-muted-foreground">
              No leads match the current filters.
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
