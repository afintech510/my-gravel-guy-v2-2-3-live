import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Camera, Loader2, AlertCircle, Package, ShieldCheck, PenLine, Smartphone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import StarRating from '@/components/reviews/StarRating';

interface ConfirmationRecord {
  token: string;
  order_id: string;
  confirmed_at: string | null;
  confirmed_delivery: boolean;
  verified_at: string | null;
  product_name: string | null;
  quantity_tons: number | null;
  delivery_address: string | null;
  delivery_date: string | null;
  customer_name: string | null;
  stripe_payment_id: string | null;
  customer_phone: string | null;
  customer_email: string | null;
}

type PageState = 'loading' | 'not_found' | 'already_confirmed' | 'verify' | 'ready' | 'submitting' | 'success';

const LOGO_URL = 'https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//mygravelguy_logo_150x200.png';

// ── Signature Canvas (defined outside to keep stable identity) ────────────────
const SignatureCanvas: React.FC<{
  onSignatureChange: (blob: Blob | null) => void;
}> = ({ onSignatureChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const [showClear, setShowClear] = useState(false);
  const onSignatureChangeRef = useRef(onSignatureChange);
  onSignatureChangeRef.current = onSignatureChange;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if ('touches' in e && e.touches.length > 0) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY,
        };
      }
      const me = e as MouseEvent;
      return {
        x: (me.clientX - rect.left) * scaleX,
        y: (me.clientY - rect.top) * scaleY,
      };
    };

    const startDraw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      isDrawingRef.current = true;
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#F5F7FA';
      ctx.lineTo(x, y);
      ctx.stroke();
      if (!hasDrawnRef.current) {
        hasDrawnRef.current = true;
        setShowClear(true);
      }
    };

    const endDraw = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      if (hasDrawnRef.current) {
        canvas.toBlob(blob => {
          onSignatureChangeRef.current(blob);
        }, 'image/png');
      }
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    return () => {
      canvas.removeEventListener('mousedown', startDraw);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', endDraw);
      canvas.removeEventListener('mouseleave', endDraw);
      canvas.removeEventListener('touchstart', startDraw);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', endDraw);
    };
  }, []);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    setShowClear(false);
    onSignatureChange(null);
  };

  return (
    <div>
      <div className="relative border-2 border-[rgba(255,255,255,0.15)] rounded-lg overflow-hidden bg-[#0F1115]">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full h-28 touch-none cursor-crosshair"
        />
        {!showClear && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[#6B7280] text-sm">Sign here with your finger or mouse</span>
          </div>
        )}
        <div className="absolute bottom-4 left-6 right-6 border-b border-[rgba(255,255,255,0.15)]" />
      </div>
      {showClear && (
        <button type="button" onClick={clear} className="text-[#6B7280] text-xs mt-1.5 hover:text-[#B7C0CC]">
          Clear signature
        </button>
      )}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const maskPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return '***-***-' + digits.slice(-4);
};

const maskEmailAddr = (email: string) => {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  const masked = local.length <= 2 ? '*'.repeat(local.length) : local[0] + '*'.repeat(local.length - 2) + local[local.length - 1];
  return `${masked}@${domain}`;
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
    });
  } catch { return dateStr; }
};

// ── Order Summary (defined outside to keep stable identity) ───────────────────
const OrderSummary: React.FC<{ record: ConfirmationRecord }> = ({ record }) => (
  <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
    <div className="flex items-start gap-3">
      <Package className="w-5 h-5 text-[#14FF6A] mt-0.5 flex-shrink-0" />
      <div className="space-y-1 min-w-0">
        <p className="text-[#F5F7FA] font-semibold">
          {record.product_name || 'Your Order'}
          {record.quantity_tons && <span className="text-[#B7C0CC] font-normal"> · {record.quantity_tons} tons</span>}
        </p>
        {record.delivery_address && <p className="text-[#B7C0CC] text-sm">{record.delivery_address}</p>}
        {record.delivery_date && <p className="text-[#B7C0CC] text-sm">{formatDate(record.delivery_date)}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 pt-1">
          <p className="text-[#6B7280] text-xs">Order # <span className="text-[#B7C0CC]">{record.order_id}</span></p>
          {record.stripe_payment_id && (
            <p className="text-[#6B7280] text-xs">Payment <span className="text-[#B7C0CC]">{record.stripe_payment_id}</span></p>
          )}
        </div>
      </div>
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const DeliveryConfirm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [pageState, setPageState] = useState<PageState>('loading');
  const [record, setRecord] = useState<ConfirmationRecord | null>(null);

  // Verification state
  const [verifyCode, setVerifyCode] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [verifyMethod, setVerifyMethod] = useState<'sms' | 'email' | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Form state
  const [confirmed, setConfirmed] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Location state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Capture geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    if (!token) { setPageState('not_found'); return; }
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_confirmations')
          .select('token, order_id, confirmed_at, confirmed_delivery, verified_at, product_name, quantity_tons, delivery_address, delivery_date, customer_name, stripe_payment_id, customer_phone, customer_email')
          .eq('token', token)
          .maybeSingle();

        console.log('[DeliveryConfirm] load result:', { data: !!data, error: error?.message });
        if (error || !data) { setPageState('not_found'); return; }
        setRecord(data as ConfirmationRecord);
        if (data.confirmed_at) setPageState('already_confirmed');
        else if (data.verified_at) setPageState('ready');
        else setPageState('verify');
      } catch (err) {
        console.error('[DeliveryConfirm] load error:', err);
        setPageState('not_found');
      }
    };
    load();
  }, [token]);

  // ── Verification handlers ──────────────────────────────────────────────────
  const handleSendCode = async (method?: 'sms' | 'email') => {
    if (!token) return;
    setIsSendingCode(true);
    setVerifyError(null);
    try {
      const { data, error } = await supabase.functions.invoke('delivery-verify', {
        body: { action: 'send_code', token, method },
      });
      if (error) throw error;
      const res = typeof data === 'string' ? JSON.parse(data) : data;
      if (res.error) throw new Error(res.error);
      setVerifyMethod(res.method || 'sms');
      setMaskedPhone(res.masked_phone || '');
      setMaskedEmail(res.masked_email || '');
      setCodeSent(true);
    } catch (err: any) {
      setVerifyError(err.message || 'Failed to send code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!token || !verifyCode.trim()) return;
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const { data, error } = await supabase.functions.invoke('delivery-verify', {
        body: { action: 'verify_code', token, code: verifyCode.trim() },
      });
      if (error) throw error;
      const res = typeof data === 'string' ? JSON.parse(data) : data;
      if (res.error) throw new Error(res.error);
      if (res.verified || res.already_verified) setPageState('ready');
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // ── Form handlers ──────────────────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) { setSubmitError('Please check the confirmation box.'); return; }
    if (!signatureBlob) { setSubmitError('Please draw your signature.'); return; }
    if (!record || !token) return;

    setSubmitError(null);
    setPageState('submitting');

    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split('.').pop() || 'jpg';
        const path = `${token}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('delivery-photos').upload(path, photoFile, { contentType: photoFile.type });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('delivery-photos').getPublicUrl(path);
          photoUrl = urlData.publicUrl;
        }
      }

      let signatureUrl: string | null = null;
      const sigPath = `${token}/signature-${Date.now()}.png`;
      const { error: sigErr } = await supabase.storage.from('delivery-photos').upload(sigPath, signatureBlob, { contentType: 'image/png' });
      if (!sigErr) {
        const { data: sigUrlData } = supabase.storage.from('delivery-photos').getPublicUrl(sigPath);
        signatureUrl = sigUrlData.publicUrl;
      }

      const { error: updateErr } = await supabase
        .from('delivery_confirmations')
        .update({
          confirmed_at: new Date().toISOString(),
          confirmed_delivery: true,
          photo_url: photoUrl,
          signature_url: signatureUrl,
          rating: rating > 0 ? rating : null,
          review_text: reviewText.trim() || null,
          confirmed_location: location,
          confirmed_user_agent: navigator.userAgent,
        })
        .eq('token', token);

      if (updateErr) throw updateErr;
      setPageState('success');
    } catch {
      setSubmitError('Something went wrong. Please try again.');
      setPageState('ready');
    }
  };

  // ── Header with logo (stable JSX, not a component) ─────────────────────────
  const firstName = record?.customer_name?.split(' ')[0];
  const header = (
    <div className="text-center mb-6">
      <img src={LOGO_URL} alt="My Gravel Guy" className="h-16 w-auto mx-auto mb-3" />
      <h1 className="text-[#F5F7FA] text-xl font-bold">Thank you{firstName ? `, ${firstName}` : ''}!</h1>
      <p className="text-[#B7C0CC] text-sm mt-1">Please confirm your delivery below.</p>
    </div>
  );

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-start py-8 px-4">
        <div className="w-full max-w-md">
          {header}
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#14FF6A] animate-spin" /></div>
        </div>
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────────
  if (pageState === 'not_found') {
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-start py-8 px-4">
        <div className="w-full max-w-md">
          {header}
          <div className="bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#F5F7FA] mb-2">Link Invalid</h2>
            <p className="text-[#B7C0CC]">This confirmation link is invalid or has expired.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Already confirmed ──────────────────────────────────────────────────────
  if (pageState === 'already_confirmed' && record) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-start py-8 px-4">
        <div className="w-full max-w-md">
          {header}
          <div className="bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-2xl p-8 text-center">
            <CheckCircle className="w-12 h-12 text-[#14FF6A] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#F5F7FA] mb-2">Already Confirmed</h2>
            <p className="text-[#B7C0CC]">
              This delivery was confirmed on{' '}
              {new Date(record.confirmed_at!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-start py-8 px-4">
        <div className="w-full max-w-md">
          {header}
          <div className="bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-2xl p-8 text-center">
            <CheckCircle className="w-14 h-14 text-[#14FF6A] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#F5F7FA] mb-3">Delivery Confirmed!</h2>
            <p className="text-[#B7C0CC] mb-2">
              Thank you{record?.customer_name ? `, ${record.customer_name.split(' ')[0]}` : ''}! Your signed confirmation has been securely recorded.
            </p>
            {rating > 0 && <p className="text-[#B7C0CC] text-sm">Your review has been submitted — we appreciate the feedback!</p>}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Verify identity ────────────────────────────────────────────────
  if (pageState === 'verify') {
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-start py-8 px-4">
        <div className="w-full max-w-md">
          {header}
          <div className="bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#14FF6A]/20 to-[#059669]/20 border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#14FF6A]" />
                <h2 className="text-lg font-bold text-[#F5F7FA]">Verify Your Identity</h2>
              </div>
              <p className="text-[#B7C0CC] text-sm mt-1">Step 1 of 2 — we'll send a code to verify your identity</p>
            </div>

            {record && <OrderSummary record={record} />}

            <div className="px-6 py-5 space-y-4">
              {!codeSent ? (
                <>
                  <p className="text-[#B7C0CC] text-sm">
                    To protect your delivery record, we need to verify it's you. Choose how you'd like to receive your 6-digit verification code:
                  </p>
                  <div className="space-y-3">
                    {record?.customer_phone && (
                      <button
                        onClick={() => handleSendCode('sms')}
                        disabled={isSendingCode}
                        className="w-full bg-[#14FF6A] text-black font-bold py-4 rounded-lg text-base hover:bg-[#10e05c] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSendingCode && verifyMethod !== 'email' ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : <><Smartphone className="w-5 h-5" /> Text me at {maskPhone(record.customer_phone)}</>}
                      </button>
                    )}
                    {record?.customer_email && (
                      <button
                        onClick={() => handleSendCode('email')}
                        disabled={isSendingCode}
                        className={`w-full font-bold py-4 rounded-lg text-base transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                          record?.customer_phone
                            ? 'bg-[#1A1F2B] text-[#F5F7FA] border border-[rgba(255,255,255,0.15)] hover:border-[#14FF6A]'
                            : 'bg-[#14FF6A] text-black hover:bg-[#10e05c]'
                        }`}
                      >
                        {isSendingCode && verifyMethod !== 'sms' ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : <><Mail className="w-5 h-5" /> Email me at {maskEmailAddr(record.customer_email)}</>}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[#B7C0CC] text-sm">
                    A 6-digit code was sent to{' '}
                    <span className="text-[#F5F7FA] font-medium">
                      {verifyMethod === 'email' ? maskedEmail : maskedPhone}
                    </span>
                    {verifyMethod === 'email' ? '. Check your inbox (and spam folder).' : '. Enter it below.'}
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={verifyCode}
                    onChange={e => { setVerifyCode(e.target.value.replace(/\D/g, '')); setVerifyError(null); }}
                    placeholder="000000"
                    className="w-full bg-[#0F1115] border border-[rgba(255,255,255,0.15)] rounded-lg px-4 py-4 text-[#F5F7FA] text-center text-2xl font-mono tracking-[0.4em] focus:outline-none focus:border-[#14FF6A] transition-colors placeholder-[#6B7280]"
                  />
                  <button
                    onClick={handleVerifyCode}
                    disabled={isVerifying || verifyCode.length < 6}
                    className="w-full bg-[#14FF6A] text-black font-bold py-4 rounded-lg text-base hover:bg-[#10e05c] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isVerifying ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : <><ShieldCheck className="w-5 h-5" /> Verify & Continue</>}
                  </button>
                  <button onClick={() => handleSendCode(verifyMethod || undefined)} disabled={isSendingCode} className="w-full text-[#6B7280] text-sm hover:text-[#B7C0CC] py-2">
                    {isSendingCode ? 'Sending...' : `Didn't receive it? Send again${verifyMethod === 'email' ? ' (check spam)' : ''}`}
                  </button>
                </>
              )}

              {verifyError && <p className="text-red-400 text-sm text-center">{verifyError}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Confirmation form (verified) ───────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-start py-8 px-4">
      <div className="w-full max-w-md">
        {header}
        <div className="bg-[#151A22] border border-[rgba(255,255,255,0.10)] rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#14FF6A]/20 to-[#059669]/20 border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
            <h2 className="text-lg font-bold text-[#F5F7FA]">Confirm Your Delivery</h2>
            <p className="text-[#B7C0CC] text-sm mt-1">Step 2 of 2 — sign and confirm</p>
          </div>

          {record && <OrderSummary record={record} />}

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
            {/* Confirmation checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input type="checkbox" checked={confirmed} onChange={e => { setConfirmed(e.target.checked); setSubmitError(null); }} className="sr-only" />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${confirmed ? 'bg-[#14FF6A] border-[#14FF6A]' : 'border-[rgba(255,255,255,0.30)] group-hover:border-[#14FF6A]'}`}>
                  {confirmed && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
              <span className="text-[#F5F7FA] text-sm leading-5">
                I confirm that the materials described above were delivered to the specified address and I have received them in acceptable condition.
              </span>
            </label>

            {/* Signature — required */}
            <div>
              <p className="text-[#B7C0CC] text-sm font-medium mb-2 flex items-center gap-1.5">
                <PenLine className="w-4 h-4" /> Sign to confirm <span className="text-red-400">*</span>
              </p>
              <SignatureCanvas onSignatureChange={setSignatureBlob} />
            </div>

            {/* Photo — optional */}
            <div>
              <p className="text-[#B7C0CC] text-sm font-medium mb-2">Add a photo of the delivered materials <span className="text-[#6B7280]">(optional)</span></p>
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                  <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">Remove</button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-[rgba(255,255,255,0.15)] rounded-lg py-6 flex flex-col items-center gap-2 text-[#B7C0CC] hover:border-[#14FF6A]/50 transition-colors">
                  <Camera className="w-6 h-6" /><span className="text-sm">Take or choose a photo</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
            </div>

            {/* Star rating — optional */}
            <div>
              <p className="text-[#B7C0CC] text-sm font-medium mb-2">Rate your experience <span className="text-[#6B7280]">(optional)</span></p>
              <StarRating rating={rating} interactive onRatingChange={setRating} size="lg" className="py-1" />
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

            {submitError && <p className="text-red-400 text-sm">{submitError}</p>}

            <button
              type="submit"
              disabled={pageState === 'submitting'}
              className="w-full bg-[#14FF6A] text-black font-bold py-4 rounded-lg text-base hover:bg-[#10e05c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {pageState === 'submitting' ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <><CheckCircle className="w-5 h-5" /> Confirm Delivery</>}
            </button>

            <p className="text-center text-[#6B7280] text-xs">
              By signing above, you acknowledge receipt of the delivered materials. Your signature, IP address, and location are securely recorded for transaction verification.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeliveryConfirm;
