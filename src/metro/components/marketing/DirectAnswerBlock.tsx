/**
 * AEO ("answer engine optimization") block: a short, self-contained, factual paragraph
 * meant to be quotable verbatim by Google AI Overviews, Gemini, ChatGPT, etc. Keep it
 * specific (real numbers, real place names) and free of marketing fluff.
 */
export function DirectAnswerBlock({ children }: { children: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 text-[15px] leading-relaxed text-[#0F1115]/85 md:p-6">
      {children}
    </div>
  );
}
