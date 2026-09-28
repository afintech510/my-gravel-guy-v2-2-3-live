import { MapPin, PackageCheck, Truck } from 'lucide-react';
import type { Metro } from '../../types';

const STEPS = [
  {
    icon: MapPin,
    title: 'Tell us your ZIP',
    body: 'Pick gravel, mulch, sand or soil and see your exact delivered price for your zone — no phone calls.',
  },
  {
    icon: PackageCheck,
    title: 'Pick quantity & day',
    body: 'Quick-pick amounts, a coverage calculator, and real delivery days — Saturday and rush available.',
  },
  {
    icon: Truck,
    title: "We'll confirm & drop it",
    body: "We text to confirm your window, then drop it exactly where you want with a photo when it's done.",
  },
];

export function HowItWorks({ metro }: { metro: Metro }) {
  return (
    <section className="bg-[#FAF9F6] py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl font-extrabold text-[#0F1115] md:text-3xl">How it works</h2>
        <p className="mx-auto mt-2 max-w-md text-center text-[#0F1115]/60">
          Order gravel, mulch, sand or soil delivered in {metro.shortName} in about 60 seconds.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <step.icon className="h-6 w-6 text-[#0F1115]" aria-hidden="true" />
              </div>
              <p className="mb-1 text-sm font-bold text-primary">Step {i + 1}</p>
              <h3 className="mb-2 text-lg font-bold text-[#0F1115]">{step.title}</h3>
              <p className="text-sm text-[#0F1115]/65">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
