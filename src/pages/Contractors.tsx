import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { sendQuoteRequestEmail } from '@/services/quoteEmailService';
import { trackEvent } from '@/utils/analytics';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const formSchema = z.object({
  material: z.string().min(1, 'Please select a material'),
  quantity: z.string().min(1, 'Please enter quantity'),
  zipCode: z.string().min(5, 'Please enter a valid ZIP code'),
  email: z.string().email('Please enter a valid email'),
  deliveryNotes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const MATERIALS = [
  '#57 Stone',
  '#67 Stone',
  '#8 Stone',
  '#10 Screenings',
  'Base / Road Base',
  'RCA',
  'Mason Sand',
  'Sand',
  'Playground Stone',
  'Decomposed Granite',
  'Structural Fill',
  'Topsoil',
  'Loam',
  'Mulch',
  'Drainage Rock',
  'Other',
];

const Contractors = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      material: '',
      quantity: '',
      zipCode: '',
      email: '',
      deliveryNotes: '',
    }
  });

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = form;
  const materialValue = watch('material');

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      trackEvent('contractor_quote_request', 'quote', `${data.material} - ${data.quantity} tons`);

      const messageContent = [
        `Material: ${data.material}`,
        `Quantity: ${data.quantity} tons`,
        `Delivery ZIP: ${data.zipCode}`,
        data.deliveryNotes ? `Delivery Notes: ${data.deliveryNotes}` : null,
      ].filter(Boolean).join('\n');

      const result = await sendQuoteRequestEmail({
        name: 'Contractor Quote Request',
        email: data.email,
        phone: '',
        message: messageContent,
        zipCode: data.zipCode,
        material: data.material,
        estimatedTons: parseFloat(data.quantity) || undefined,
        sourcePage: '/contractors',
      });

      if (result.success) {
        toast.success('Quote request submitted! Check your email for confirmation.');
        reset();
        setIsModalOpen(false);
      } else {
        toast.error('Failed to submit request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openQuoteModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const renderQuoteForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label className="text-xs font-semibold uppercase text-[#B7C0CC] mb-1.5 block">Material Needed</Label>
        <Select value={materialValue} onValueChange={(value) => setValue('material', value)}>
          <SelectTrigger className="w-full bg-[#0F1115] border-[rgba(255,255,255,0.1)] text-white">
            <SelectValue placeholder="Select material" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1f28] border-[rgba(255,255,255,0.2)] z-50">
            {MATERIALS.map((material) => (
              <SelectItem 
                key={material} 
                value={material}
                className="text-white hover:bg-[#2a3040] focus:bg-[#2a3040] focus:text-white cursor-pointer"
              >
                {material}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.material && <p className="text-red-400 text-xs mt-1">{errors.material.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold uppercase text-[#B7C0CC] mb-1.5 block">Quantity (Tons)</Label>
          <Input
            {...register('quantity')}
            placeholder="e.g. 100"
            className="bg-[#0F1115] border-[rgba(255,255,255,0.1)] text-white placeholder:text-gray-500"
          />
          {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity.message}</p>}
        </div>
        <div>
          <Label className="text-xs font-semibold uppercase text-[#B7C0CC] mb-1.5 block">Delivery ZIP</Label>
          <Input
            {...register('zipCode')}
            placeholder="90210"
            className="bg-[#0F1115] border-[rgba(255,255,255,0.1)] text-white placeholder:text-gray-500"
          />
          {errors.zipCode && <p className="text-red-400 text-xs mt-1">{errors.zipCode.message}</p>}
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold uppercase text-[#B7C0CC] mb-1.5 block">Company Email</Label>
        <Input
          {...register('email')}
          type="email"
          placeholder="pm@construction.com"
          className="bg-[#0F1115] border-[rgba(255,255,255,0.1)] text-white placeholder:text-gray-500"
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <Label className="text-xs font-semibold uppercase text-[#B7C0CC] mb-1.5 block">Delivery Notes (Optional)</Label>
        <Textarea
          {...register('deliveryNotes')}
          placeholder="Special delivery instructions, site access details, preferred delivery times..."
          className="bg-[#0F1115] border-[rgba(255,255,255,0.1)] text-white placeholder:text-gray-500 min-h-[80px]"
        />
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#BADF24] text-black font-montserrat font-bold uppercase hover:bg-white"
      >
        {isSubmitting ? 'Sending...' : 'Request Pricing'}
      </Button>
    </form>
  );

  return (
    <>
      <Helmet>
        <title>Contractor Gravel & Aggregate Delivery | MyGravelGuy</title>
        <meta name="description" content="Nationwide aggregate sourcing and delivery for construction teams. One point of contact for all your gravel, stone, and sand needs across all 50 states." />
        <meta name="keywords" content="contractor gravel delivery, bulk aggregate, construction materials, nationwide stone delivery, commercial gravel" />
        <link rel="canonical" href="https://mygravelguy.com/contractors" />
      </Helmet>

      {/* Dark mode navbar wrapper */}
      <div className="dark bg-[#0F1115] [&_nav]:bg-[#0F1115] [&_nav]:border-[rgba(255,255,255,0.1)] [&_nav_a]:text-gray-300 [&_nav_a:hover]:text-white [&_nav_button]:text-gray-300">
        <Navbar />
      </div>

      <div className="min-h-screen bg-[#0F1115] text-[#F5F7FA]">
        {/* Hero Section */}
        <div className="max-w-[1200px] mx-auto px-6">
          <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-15 items-center py-24 lg:py-28">
            <div>
              <div className="inline-block bg-[rgba(186,223,36,0.1)] text-[#BADF24] px-3 py-1 rounded-full text-xs font-semibold border border-[#BADF24] mb-4">
                All 50 States Served
              </div>
              <h1 className="font-montserrat font-extrabold text-5xl lg:text-[64px] leading-[1.1] uppercase tracking-tight mb-6">
                Do You Have a Gravel Guy?
              </h1>
              <p className="text-xl text-[#B7C0CC] mb-8 max-w-[500px]">
                Nationwide aggregate sourcing and delivery for construction teams that work across multiple cities. Turf, surfacing, and playground specialists.
              </p>
              <ul className="mb-10 space-y-3">
                <li className="flex items-center">
                  <span className="text-[#BADF24] font-bold mr-3">✓</span>
                  Tell us material, quantity, where, and when
                </li>
                <li className="flex items-center">
                  <span className="text-[#BADF24] font-bold mr-3">✓</span>
                  We coordinate yards, quarries, and trucking
                </li>
                <li className="flex items-center">
                  <span className="text-[#BADF24] font-bold mr-3">✓</span>
                  Same-day / Next-day delivery options
                </li>
              </ul>
              <div className="flex gap-4">
                <button
                  onClick={openQuoteModal}
                  className="bg-[#BADF24] text-black px-7 py-3.5 rounded font-montserrat font-bold uppercase text-sm hover:bg-white transition-colors"
                >
                  Get a Quote
                </button>
                <Link
                  to="/shop"
                  className="border border-[rgba(255,255,255,0.1)] text-white px-7 py-3.5 rounded font-montserrat font-bold uppercase text-sm hover:border-[#BADF24] transition-colors"
                >
                  Order Instantly
                </Link>
              </div>
            </div>

            {/* Quote Form Card */}
            <div className="bg-[#151A22] p-8 rounded-lg border border-[rgba(255,255,255,0.1)]">
              <h3 className="font-montserrat font-semibold text-xl uppercase mb-2">Get a Fast Quote</h3>
              <p className="text-sm text-[#B7C0CC] mb-6">Best for 50+ tons or multi-load projects.</p>
              {renderQuoteForm()}
            </div>
          </section>
        </div>

        {/* Problem Section */}
        <section className="py-20 bg-[#0a0c0f] border-y border-[rgba(255,255,255,0.1)]">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-montserrat font-extrabold text-3xl lg:text-[40px] uppercase mb-4">
                Stop wasting hours calling yards in every city.
              </h2>
              <p className="text-[#B7C0CC] max-w-[700px] mx-auto text-lg">
                When you're running installs across multiple markets, sourcing rock shouldn't be a side-quest. We become your single point of contact for everything aggregate.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-10">
              {[
                { title: 'No Trusted Local Supplier', desc: 'Stop gambling on new quarries in every city. We already know who\'s reliable and who has the inventory.' },
                { title: 'Trucking Bottlenecks', desc: 'The material is there, but the trucks aren\'t. We manage the haulers so your crew stays on schedule.' },
                { title: 'Inconsistent Pricing', desc: 'Get transparent, competitive project pricing based on volume, not "retail" walk-in rates.' },
                { title: 'Too Many Vendors', desc: 'One invoice. One point of contact. One nationwide gravel guy. Simplify your procurement.' },
              ].map((item, i) => (
                <div key={i} className="p-6 border-l-[3px] border-[#BADF24] bg-[#151A22]">
                  <h4 className="font-montserrat font-semibold uppercase mb-2">{item.title}</h4>
                  <p className="text-[#B7C0CC]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Materials Section */}
        <section id="materials" className="py-20">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-montserrat font-extrabold text-3xl lg:text-[40px] uppercase">
                Materials We Deliver Nationwide
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: '#57 Stone', desc: 'Clean, consistent 3/4" stone for drainage, bedding, and base work.' },
                { title: 'Road Base', desc: 'Compaction-friendly crusher run for road and pad preparation.' },
                { title: 'Playground Stone', desc: 'Certified safety aggregate for playgrounds and impact surfacing.' },
                { title: 'Mason Sand', desc: 'Fine-screened sand for pavers, masonry, and athletic fields.' },
                { title: 'Decomposed Granite', desc: 'Natural fines for pathways, trails, and decorative surfacing.' },
                { title: 'Structural Fill', desc: 'Bulk material for major site prep and volume projects.' },
              ].map((item, i) => (
                <div key={i} className="bg-[#151A22] p-8 rounded-lg border border-[rgba(255,255,255,0.1)]">
                  <h4 className="font-montserrat font-semibold uppercase text-[#BADF24] mb-3">{item.title}</h4>
                  <p className="text-sm text-[#B7C0CC]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-20 bg-[#0a0c0f] border-y border-[rgba(255,255,255,0.1)]">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Instant Order Card */}
              <div className="p-12 rounded-lg border border-[rgba(255,255,255,0.1)]">
                <h3 className="font-montserrat font-semibold text-xl uppercase mb-2">Instant Order</h3>
                <p className="text-[#B7C0CC] mb-6">Best for urgent needs or smaller quantities.</p>
                <ul className="space-y-2 mb-8">
                  <li>✓ Quick checkout</li>
                  <li>✓ Standard 2-day delivery</li>
                  <li>✓ 15-25 ton increments</li>
                </ul>
                <Link
                  to="/shop"
                  className="block text-center border border-[rgba(255,255,255,0.1)] text-white px-7 py-3.5 rounded font-montserrat font-bold uppercase text-sm hover:border-[#BADF24] transition-colors"
                >
                  Order Online
                </Link>
              </div>

              {/* Managed Quote Card */}
              <div className="p-12 rounded-lg border border-[#BADF24] relative">
                <div className="absolute top-5 right-5 bg-[#BADF24] text-black text-[10px] font-extrabold px-2 py-1">
                  MOST POPULAR
                </div>
                <h3 className="font-montserrat font-semibold text-xl uppercase mb-2">Managed Quote</h3>
                <p className="text-[#B7C0CC] mb-6">Best for 50+ tons and multi-load projects.</p>
                <ul className="space-y-2 mb-8">
                  <li>✓ Dedicated sourcing specialist</li>
                  <li>✓ Aggressive volume pricing</li>
                  <li>✓ Coordinated truck scheduling</li>
                </ul>
                <button
                  onClick={openQuoteModal}
                  className="block w-full text-center bg-[#BADF24] text-black px-7 py-3.5 rounded font-montserrat font-bold uppercase text-sm hover:bg-white transition-colors"
                >
                  Request Quote
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="bg-[#151A22] p-16 lg:p-20 border border-[#BADF24] rounded-lg text-center">
              <h2 className="font-montserrat font-extrabold text-3xl lg:text-[48px] uppercase mb-4">
                Stop Chasing Stone. Start Building.
              </h2>
              <p className="text-[#B7C0CC] text-xl mb-10">
                Tell us what you need and where it goes—MyGravelGuy coordinates the rest.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={openQuoteModal}
                  className="bg-[#BADF24] text-black px-7 py-3.5 rounded font-montserrat font-bold uppercase text-sm hover:bg-white transition-colors"
                >
                  Get a Quote
                </button>
                <Link
                  to="/shop"
                  className="border border-[rgba(255,255,255,0.1)] text-white px-7 py-3.5 rounded font-montserrat font-bold uppercase text-sm hover:border-[#BADF24] transition-colors"
                >
                  Order Now
                </Link>
              </div>
              <p className="mt-6 text-xs text-[#B7C0CC] uppercase tracking-widest">
                No contracts. No minimums. Just reliable delivery.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Dark mode footer wrapper */}
      <div className="dark bg-[#0F1115] [&_footer]:bg-[#0F1115] [&_footer]:border-[rgba(255,255,255,0.1)] [&_footer_h3]:text-white [&_footer_a]:text-gray-400 [&_footer_a:hover]:text-[#BADF24] [&_footer_p]:text-gray-500 [&_footer_hr]:border-[rgba(255,255,255,0.1)]">
        <Footer />
      </div>

      {/* Quote Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#151A22] border-[rgba(255,255,255,0.1)] text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-montserrat font-semibold text-xl uppercase text-white">Get a Fast Quote</DialogTitle>
            <DialogDescription className="text-[#B7C0CC]">
              Best for 50+ tons or multi-load projects. We'll get back to you within 24 hours.
            </DialogDescription>
          </DialogHeader>
          {renderQuoteForm()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Contractors;
