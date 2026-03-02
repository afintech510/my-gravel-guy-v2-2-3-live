import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Camera, Loader2, AlertCircle, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import StarRating from '@/components/reviews/StarRating';

interface ConfirmationRecord {
  token: string;
  order_id: string;
  confirmed_at: string | null;
  confirmed_delivery: boolean;
  product_name: string | null;
  quantity_tons: number | null;
  delivery_address: string | null;
  delivery_date: string | null;
  customer_name: string | null;
}

type PageState = 'loading' | 'not_found' | 'already_confirmed' | 'ready' | 'submitting' | 'success';

const DeliveryConfirm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [pageState, setPageState] = useState<PageState>('loading');
  const [record, setRecord] = useState<ConfirmationRecord | null>(null);

  // Form state
  const [confirmed, setConfirmed] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) {
      setPageState('not_found');
      return;
    }
    const load = async () => {
      const { data, error } = await supabase
        .from('delivery_confirmations')
        .select('token, order_id, confirmed_at, confirmed_delivery, product_name, quantity_tons, delivery_address, delivery_date, customer_name')
        .eq('token', token)
        .maybeSingle();

      if (error || !data) {
        setPageState('not_found');
        return;
      }
      setRecord(data as ConfirmationRecord);
      setPageState(data.confirmed_at ? 'already_confirmed' : 'ready');
    };
    load();
  }, [token]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      setSubmitError('Please check the confirmation box to proceed.');
      return;
    }
    if (!record || !token) return;

    setSubmitError(null);
    setPageState('submitting');

    try {
      let photoUrl: string | null = null;

      if (photoFile) {
        const ext = photoFile.name.split('.').pop() || 'jpg';
        const path = `${token}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('delivery-photos')
          .upload(path, photoFile, { contentType: photoFile.type });

        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('delivery-photos')
            .getPublicUrl(path);
          photoUrl = urlData.publicUrl;
        }
      }

      const { error: updateErr } = await supabase
        .from('delivery_confirmations')
        .update({
          confirmed_at: new Date().toISOString(),
          confirmed_delivery: true,
          photo_url: photoUrl,
          rating: rating > 0 ? rating : null,
          review_text: reviewText.trim() || null,
        })
        .eq('token', token);

      if (updateErr) throw updateErr;

      setPageState('success');
    } catch {
      setSubmitError('Something went wrong. Please try again.');
      setPageState('ready');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // ── Layout wrapper ──────────────────────────────────────────────────────────
  const Wrap = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-start py-8 px-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="text-3xl mb-1">🪨</div>
          <h1 className="text-xl font-bold text-[#F5F7FA]">My Gravel Guy</h1>
        </div>
        {children}
      </div>
    </div>
  );

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <Wrap>
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#14FF6A] animate-spin" />
        </div>
      </Wrap>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────────
  if (pageState === 'not_found') {
    return (
      <Wrap>
        <div className="bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#F5F7FA] mb-2">Link Invalid</h2>
          <p className="text-[#B7C0CC]">This confirmation link is invalid or has expired. Please contact us if you need assistance.</p>
        </div>
      </Wrap>
    );
  }

  // ── Already confirmed ───────────────────────────────────────────────────────
  if (pageState === 'already_confirmed' && record) {
    return (
      <Wrap>
        <div className="bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-2xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-[#14FF6A] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#F5F7FA] mb-2">Already Confirmed</h2>
          <p className="text-[#B7C0CC]">
            This delivery was confirmed on{' '}
            {new Date(record.confirmed_at!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
            Thank you!
          </p>
        </div>
      </Wrap>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (pageState === 'success') {
    return (
      <Wrap>
        <div className="bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-2xl p-8 text-center">
          <CheckCircle className="w-14 h-14 text-[#14FF6A] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#F5F7FA] mb-3">Delivery Confirmed!</h2>
          <p className="text-[#B7C0CC] mb-2">
            Thank you{record?.customer_name ? `, ${record.customer_name.split(' ')[0]}` : ''}! Your confirmation has been recorded.
          </p>
          {rating > 0 && (
            <p className="text-[#B7C0CC] text-sm">Your review has been submitted — we appreciate the feedback!</p>
          )}
        </div>
      </Wrap>
    );
  }

  // ── Form (ready / submitting) ────────────────────────────────────────────────
  return (
    <Wrap>
      <div className="bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#14FF6A]/20 to-[#059669]/20 border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
          <h2 className="text-lg font-bold text-[#F5F7FA]">Confirm Your Delivery</h2>
          <p className="text-[#B7C0CC] text-sm mt-1">Takes about 60 seconds</p>
        </div>

        {/* Order summary */}
        {record && (
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-[#14FF6A] mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-[#F5F7FA] font-semibold">
                  {record.product_name || 'Your Order'}
                  {record.quantity_tons && (
                    <span className="text-[#B7C0CC] font-normal"> · {record.quantity_tons} tons</span>
                  )}
                </p>
                {record.delivery_address && (
                  <p className="text-[#B7C0CC] text-sm">{record.delivery_address}</p>
                )}
                {record.delivery_date && (
                  <p className="text-[#B7C0CC] text-sm">{formatDate(record.delivery_date)}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          {/* Confirmation checkbox — required */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => { setConfirmed(e.target.checked); setSubmitError(null); }}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                confirmed ? 'bg-[#14FF6A] border-[#14FF6A]' : 'border-[rgba(255,255,255,0.30)] group-hover:border-[#14FF6A]'
              }`}>
                {confirmed && (
                  <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-[#F5F7FA] text-sm leading-5">
              Yes, my materials were delivered to the address above
            </span>
          </label>

          {/* Photo upload — optional */}
          <div>
            <p className="text-[#B7C0CC] text-sm font-medium mb-2">Add a photo <span className="text-[#6B7280]">(optional)</span></p>
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[rgba(255,255,255,0.15)] rounded-lg py-6 flex flex-col items-center gap-2 text-[#B7C0CC] hover:border-[#14FF6A]/50 transition-colors"
              >
                <Camera className="w-6 h-6" />
                <span className="text-sm">Take or choose a photo</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Star rating — optional */}
          <div>
            <p className="text-[#B7C0CC] text-sm font-medium mb-2">Rate your experience <span className="text-[#6B7280]">(optional)</span></p>
            <StarRating
              rating={rating}
              interactive
              onRatingChange={setRating}
              size="lg"
              className="py-1"
            />
          </div>

          {/* Review — optional */}
          <div>
            <p className="text-[#B7C0CC] text-sm font-medium mb-2">Leave a review <span className="text-[#6B7280]">(optional)</span></p>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="How did it go? Was the delivery on time? Good materials?"
              rows={3}
              className="w-full bg-[#0F1115] border border-[rgba(255,255,255,0.10)] rounded-lg px-4 py-3 text-[#F5F7FA] placeholder-[#6B7280] focus:outline-none focus:border-[#14FF6A] transition-colors resize-none text-sm"
            />
          </div>

          {submitError && (
            <p className="text-red-400 text-sm">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={pageState === 'submitting'}
            className="w-full bg-[#14FF6A] text-black font-bold py-4 rounded-lg text-base hover:bg-[#10e05c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {pageState === 'submitting' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Confirm Delivery
              </>
            )}
          </button>

          <p className="text-center text-[#6B7280] text-xs">
            Your confirmation is securely recorded and helps protect both parties.
          </p>
        </form>
      </div>
    </Wrap>
  );
};

export default DeliveryConfirm;
