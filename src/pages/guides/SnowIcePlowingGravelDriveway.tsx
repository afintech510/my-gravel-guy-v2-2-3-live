import { GuidePageShell } from '@/components/guides/GuidePageShell';
import { snowIcePlowingGravelDriveway } from '@/content/guides';

export default function SnowIcePlowingGravelDriveway() {
  return (
    <GuidePageShell content={snowIcePlowingGravelDriveway}>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#0F1115]">Winter checklist</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-[#0F1115]/70">
          <li>Set plow blades 1–2 inches above the gravel surface.</li>
          <li>Use rubber or poly plow edges, not steel.</li>
          <li>Mark driveway edges with reflective stakes before first snowfall.</li>
          <li>Use calcium chloride or a gravel-safe melt product, not rock salt.</li>
          <li>Top up thin spots and re-crown in fall, before winter arrives.</li>
        </ul>
      </section>
    </GuidePageShell>
  );
}
