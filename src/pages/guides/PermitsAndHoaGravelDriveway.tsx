import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { permitsAndHoaGravelDriveway } from '@/content/guides';

export default function PermitsAndHoaGravelDriveway() {
  return (
    <GuidePageShell content={permitsAndHoaGravelDriveway}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">What to check before you order</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-[#0F1115]/70">
          <li>City/county building or public works department — driveway or grading permit.</li>
          <li>HOA or deed covenants — approved materials and any gravel restrictions.</li>
          <li>Right-of-way or curb-cut rules where the driveway meets the public street.</li>
          <li>Drainage requirements if the project changes grading or runoff.</li>
        </ul>
      </section>
    </GuidePageShell>
  );
}
