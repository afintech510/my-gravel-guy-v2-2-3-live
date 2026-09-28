import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { StepList } from '@/components/guides/StepList';
import { maintenance } from '@/content/guides';

export default function Maintenance() {
  return (
    <GuidePageShell content={maintenance}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Maintenance checklist</h2>
        <StepList steps={maintenance.howToSteps ?? []} />
      </section>
    </GuidePageShell>
  );
}
