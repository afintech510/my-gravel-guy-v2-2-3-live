import type { GuideHowToStep } from '@/content/guides/types';

/** Visible step list matching the HowTo JSON-LD steps 1:1 (see src/content/guides/schema.ts). */
export function StepList({ steps }: { steps: GuideHowToStep[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={step.name} className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-sm font-bold text-[#0F1115]">
            {i + 1}. {step.name}
          </p>
          <p className="mt-1 text-sm text-[#0F1115]/70">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
