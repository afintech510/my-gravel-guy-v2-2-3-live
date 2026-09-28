import { Camera, MessageCircle, Warehouse } from 'lucide-react';
import type { Metro } from '../../types';

export function TrustStrip({ metro }: { metro: Metro }) {
  const node = metro.nodes[0];
  const items = [
    { icon: Camera, text: 'Photo proof of every drop, texted to you' },
    { icon: MessageCircle, text: 'Text updates from confirmed to delivered' },
    { icon: Warehouse, text: node ? `Fulfilled by ${node.publicLabel}` : 'Vetted local yard partners' },
  ];

  return (
    <section className="border-y border-black/5 bg-[#F2F1EA] py-8">
      <div className="container mx-auto grid gap-6 px-4 sm:grid-cols-3">
        {items.map(item => (
          <div key={item.text} className="flex items-center gap-3">
            <item.icon className="h-5 w-5 shrink-0 text-[#0F1115]/70" aria-hidden="true" />
            <span className="text-sm font-medium text-[#0F1115]/80">{item.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
