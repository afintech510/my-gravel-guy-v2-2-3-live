import React, { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

// Cards
import { SupplierCard, SupplierCardRef } from "@/components/supplier-quotes/SupplierCard";
import { ProjectRequirementsCard } from "@/components/supplier-quotes/ProjectRequirementsCard";
import { QuoteDetailsCard } from "@/components/supplier-quotes/QuoteDetailsCard";
import { BillingPaymentCard } from "@/components/supplier-quotes/BillingPaymentCard";
import { ActionBar } from "@/components/supplier-quotes/ActionBar";
import { NewLeadModal } from "@/components/supplier-quotes/NewLeadModal";

// Sidebar
import { SidebarKPIs } from "@/components/supplier-quotes/SidebarKPIs";
import { RecentLeadsList } from "@/components/supplier-quotes/RecentLeadsList";
import { QuotesForLeadList } from "@/components/supplier-quotes/QuotesForLeadList";
import { RecentQuotesList } from "@/components/supplier-quotes/RecentQuotesList";

// Types & Services
import {
  INITIAL_FORM_DATA,
  INITIAL_FLAGS,
  SupplierQuoteFormData,
  SupplierQuoteFlags,
  LeadInsert,
  generatePriceSummary,
} from "@/types/supplierQuote.types";
import {
  fetchLeads,
  fetchSupplierQuotes,
  fetchQuotesForLead,
  createLead,
  createSupplierQuote,
  updateSupplierQuote,
  updateLead,
  getSupplierQuoteById,
  formDataToQuoteInsert,
  quoteToFormData,
  getQuoteStats,
} from "@/services/supplierQuoteService";

export default function DashboardSupplierQuotes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supplierCardRef = useRef<SupplierCardRef>(null);

  // Form state
  const [formData, setFormData] = useState<SupplierQuoteFormData>(INITIAL_FORM_DATA);
  const [flags, setFlags] = useState<SupplierQuoteFlags>(INITIAL_FLAGS);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

  // Editing state
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);

  // Queries
  const { data: leads = [] } = useQuery({
    queryKey: ["supplier-leads"],
    queryFn: () => fetchLeads(50),
  });

  const { data: allQuotes = [] } = useQuery({
    queryKey: ["supplier-quotes"],
    queryFn: () => fetchSupplierQuotes(20),
  });

  const { data: stats = { count: 0, lastPriceSummary: null } } = useQuery({
    queryKey: ["supplier-quote-stats"],
    queryFn: getQuoteStats,
  });

  const selectedLead = leads.find((l) => l.id === formData.lead_id) || null;

  const { data: quotesForLead = [] } = useQuery({
    queryKey: ["quotes-for-lead", formData.lead_id],
    queryFn: () => (formData.lead_id ? fetchQuotesForLead(formData.lead_id) : Promise.resolve([])),
    enabled: !!formData.lead_id,
  });

  // Mutations
  const createLeadMutation = useMutation({
    mutationFn: createLead,
    onSuccess: (newLead) => {
      if (newLead) {
        queryClient.invalidateQueries({ queryKey: ["supplier-leads"] });
        setFormData((prev) => ({
          ...prev,
          lead_id: newLead.id,
          material: newLead.material || prev.material,
          qty_tons: newLead.requested_qty?.toString() || prev.qty_tons,
          delivery_address: newLead.job_address || prev.delivery_address,
          delivery_city: newLead.job_city || prev.delivery_city,
          delivery_state: newLead.job_state || prev.delivery_state,
          delivery_zip: newLead.job_zip || prev.delivery_zip,
        }));
        toast({ title: "Lead created", description: `${newLead.display_name} added successfully.` });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create lead. Make sure the leads table exists in Supabase.",
        variant: "destructive",
      });
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: createSupplierQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-quote-stats"] });
      queryClient.invalidateQueries({ queryKey: ["quotes-for-lead"] });
      toast({ title: "Quote saved", description: "Supplier quote has been saved successfully." });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save quote. Make sure the supplier_quotes table exists in Supabase.",
        variant: "destructive",
      });
    },
  });

  const updateQuoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReturnType<typeof formDataToQuoteInsert> }) =>
      updateSupplierQuote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-quote-stats"] });
      queryClient.invalidateQueries({ queryKey: ["quotes-for-lead"] });
      setEditingQuoteId(null);
      toast({ title: "Quote updated", description: "Supplier quote has been updated successfully." });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quote.",
        variant: "destructive",
      });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<LeadInsert> }) =>
      updateLead(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-leads"] });
      toast({ title: "Lead updated", description: "Lead information saved successfully." });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save lead.",
        variant: "destructive",
      });
    },
  });
  const handleFormChange = useCallback((updates: Partial<SupplierQuoteFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleFlagChange = useCallback((key: keyof SupplierQuoteFlags) => {
    setFlags((prev) => {
      const next = { ...prev, [key]: !prev[key] };

      // Enforce exclusivity: Material
      if (key === "material_is_unit" && next.material_is_unit) next.material_is_total = false;
      if (key === "material_is_total" && next.material_is_total) next.material_is_unit = false;

      // Enforce exclusivity: Delivery
      if (key === "delivery_flat" && next.delivery_flat) {
        next.delivery_hourly = false;
        next.delivery_included = false;
      }
      if (key === "delivery_hourly" && next.delivery_hourly) {
        next.delivery_flat = false;
        next.delivery_included = false;
      }
      if (key === "delivery_included" && next.delivery_included) {
        next.delivery_flat = false;
        next.delivery_hourly = false;
      }

      return next;
    });
  }, []);

  const handleSelectLead = useCallback(
    (leadId: string) => {
      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        setEditingQuoteId(null); // Clear any editing state
        setFormData((prev) => ({
          ...prev,
          lead_id: leadId,
          // Material & Quantity
          material: lead.material || prev.material,
          qty_tons: lead.requested_qty?.toString() || prev.qty_tons,
          // Contact Info
          contact_phone: lead.phone || prev.contact_phone,
          contact_email: lead.email || prev.contact_email,
          // Delivery Location
          delivery_address: lead.job_address || prev.delivery_address,
          delivery_city: lead.job_city || prev.delivery_city,
          delivery_state: lead.job_state || prev.delivery_state,
          delivery_zip: lead.job_zip || prev.delivery_zip,
          site_access: lead.site_access || prev.site_access,
          // Delivery Scheduling
          delivery_date: lead.delivery_date || prev.delivery_date,
          delivery_time: lead.delivery_time_preference || prev.delivery_time,
          // Notes
          project_notes: lead.notes || prev.project_notes,
        }));
      }
    },
    [leads],
  );

  const handleSelectQuote = useCallback(
    async (quoteId: string) => {
      try {
        const quote = await getSupplierQuoteById(quoteId);
        if (quote) {
          const { formData: loadedFormData, flags: loadedFlags } = quoteToFormData(quote);
          setFormData(loadedFormData);
          setFlags(loadedFlags);
          setEditingQuoteId(quoteId);
          toast({ title: "Quote loaded", description: "You can now edit this quote." });
        }
      } catch (err) {
        console.error("Failed to load quote:", err);
        toast({ title: "Error", description: "Failed to load quote for editing.", variant: "destructive" });
      }
    },
    [toast],
  );

  const handleSave = useCallback(() => {
    const quoteData = formDataToQuoteInsert(formData, flags);

    if (editingQuoteId) {
      updateQuoteMutation.mutate({ id: editingQuoteId, data: quoteData });
    } else {
      createQuoteMutation.mutate(quoteData);
    }
  }, [formData, flags, editingQuoteId, createQuoteMutation, updateQuoteMutation]);

  const handleSaveAndNew = useCallback(() => {
    const quoteData = formDataToQuoteInsert(formData, flags);

    const onSuccessCallback = () => {
      // Reset form but keep the lead
      setFormData((prev) => ({
        ...INITIAL_FORM_DATA,
        lead_id: prev.lead_id,
      }));
      setFlags(INITIAL_FLAGS);
      setEditingQuoteId(null);
      // Focus supplier name field after reset
      setTimeout(() => supplierCardRef.current?.focus(), 100);
    };

    if (editingQuoteId) {
      updateQuoteMutation.mutate({ id: editingQuoteId, data: quoteData }, { onSuccess: onSuccessCallback });
    } else {
      createQuoteMutation.mutate(quoteData, { onSuccess: onSuccessCallback });
    }
  }, [formData, flags, editingQuoteId, createQuoteMutation, updateQuoteMutation]);

  const handleCancelEdit = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setFlags(INITIAL_FLAGS);
    setEditingQuoteId(null);
    setTimeout(() => supplierCardRef.current?.focus(), 100);
  }, []);

  const handleNewLead = useCallback(
    (lead: LeadInsert) => {
      createLeadMutation.mutate(lead);
    },
    [createLeadMutation],
  );

  const handleSaveLead = useCallback(() => {
    if (!formData.lead_id) return;
    
    updateLeadMutation.mutate({
      id: formData.lead_id,
      updates: {
        phone: formData.contact_phone || undefined,
        email: formData.contact_email || undefined,
        material: formData.material || undefined,
        requested_qty: formData.qty_tons ? parseFloat(formData.qty_tons) : undefined,
        job_address: formData.delivery_address || undefined,
        job_city: formData.delivery_city || undefined,
        job_state: formData.delivery_state || undefined,
        job_zip: formData.delivery_zip || undefined,
        site_access: formData.site_access.length > 0 ? formData.site_access : undefined,
        delivery_date: formData.delivery_date || undefined,
        delivery_time_preference: formData.delivery_time || undefined,
        notes: formData.project_notes || undefined,
      },
    });
  }, [formData, updateLeadMutation]);

  // Keyboard shortcut: Ctrl/Cmd + Enter to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // Autofocus on initial load
  useEffect(() => {
    supplierCardRef.current?.focus();
  }, []);

  const priceSummary = generatePriceSummary(formData, flags);
  const isLoading = createQuoteMutation.isPending || updateQuoteMutation.isPending;

  return (
    <DashboardLayout title="Supplier Quotes" subtitle="Capture and manage quotes from suppliers">
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form - 8 columns */}
          <div className="lg:col-span-8 space-y-6">
            <ProjectRequirementsCard
              data={formData}
              onChange={handleFormChange}
              leads={leads}
              onNewLead={() => setIsNewLeadModalOpen(true)}
              onSaveLead={handleSaveLead}
              isSavingLead={updateLeadMutation.isPending}
            />

            <SupplierCard ref={supplierCardRef} data={formData} onChange={handleFormChange} />

            <QuoteDetailsCard
              data={formData}
              flags={flags}
              onChange={handleFormChange}
              onFlagChange={handleFlagChange}
            />

            <BillingPaymentCard data={formData} onChange={handleFormChange} />

            <ActionBar
              onSave={handleSave}
              onSaveAndNew={handleSaveAndNew}
              onCancelEdit={handleCancelEdit}
              isLoading={isLoading}
              priceSummary={priceSummary}
              formData={formData}
              flags={flags}
              isEditing={!!editingQuoteId}
            />
          </div>

          {/* Sidebar - 4 columns */}
          <div className="lg:col-span-4 space-y-4">
            <SidebarKPIs quoteCount={stats.count} lastPriceSummary={stats.lastPriceSummary} />

            <RecentLeadsList leads={leads} selectedLeadId={formData.lead_id || null} onSelectLead={handleSelectLead} />

            {selectedLead && (
              <QuotesForLeadList lead={selectedLead} quotes={quotesForLead} onSelectQuote={handleSelectQuote} />
            )}

            <RecentQuotesList quotes={allQuotes} onSelectQuote={handleSelectQuote} />
          </div>
        </div>
      </div>

      <NewLeadModal open={isNewLeadModalOpen} onOpenChange={setIsNewLeadModalOpen} onSave={handleNewLead} />
    </DashboardLayout>
  );
}
