import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { GuideCalculator } from '@/components/guides/GuideCalculator';
import { StepList } from '@/components/guides/StepList';
import { howMuchGravel } from '@/content/guides';

const MATH_STEPS = [
  { name: 'Find the area', text: 'Multiply length (ft) by width (ft) to get square feet.' },
  {
    name: 'Convert to cubic yards',
    text: 'Multiply square feet by depth (in inches, divided by 12) to get cubic feet, then divide by 27.',
  },
  {
    name: 'Convert to your material',
    text: "Multiply cubic yards by the material's tons-per-yard ratio if it sells by the ton, or use cubic yards directly if it sells by the yard.",
  },
];

export default function HowMuchGravel() {
  return (
    <GuidePageShell content={howMuchGravel}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Gravel driveway calculator</h2>
        <p className="text-sm text-[#0F1115]/70">
          Enter your driveway's length, width, and target depth to see how much gravel you need in each metro we
          serve, converted using that metro's real material ratios.
        </p>
        <GuideCalculator />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">How the math works</h2>
        <StepList steps={MATH_STEPS} />
      </section>
    </GuidePageShell>
  );
}
