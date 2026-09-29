import type { GuideContent } from '../types';

export const truckloadCoverageAndDeliveryMinimums: GuideContent = {
  slug: 'truckload-coverage-and-delivery-minimums',
  path: '/gravel-driveways/truckload-coverage-and-delivery-minimums',
  navLabel: 'Truckload & Delivery Minimums',
  title: 'Gravel Truckload Coverage & Minimums | MyGravelGuy',
  description:
    "How much gravel fits on a delivery truck, how many loads a driveway needs, and MyGravelGuy's delivery minimum.",
  h1: 'How Much Does a Truckload of Gravel Cover, and What Are Delivery Minimums?',
  directAnswer:
    "MyGravelGuy's delivery trucks range from about 7 tons (small) to 28 tons (large) per load, so most single driveways fit in one truckload. Delivery minimums vary by zone and metro: 3 units in every DFW zone, and 1 to 5 yards depending on zone on Long Island. Delivery cost is always included in the price shown, never billed separately.",
  howWeKnow:
    "These per-zone minimums and delivery-included pricing come directly from MyGravelGuy's metro pricing configuration, not a flat rule; the 7 to 28 ton truck-capacity range matches the truck fleet in our own pricing engine's load-planning logic.",
  lastUpdated: '2026-09-28',
  group: 'Cost & Planning',
  faqs: [
    {
      question: 'How many tons of gravel does a dump truck hold?',
      answer:
        "MyGravelGuy's fleet ranges from a 7 ton small dump truck to a 28 ton large truck, with a 14 to 15 ton tandem truck in between — the pricing engine automatically plans the most efficient combination for your order size.",
    },
    {
      question: "What is MyGravelGuy's delivery minimum?",
      answer:
        "MyGravelGuy's minimum varies by zone: every DFW zone requires 3 units per order (3 tons for gravel/sand, 3 yards for mulch/soil), while Long Island ranges from 1 yard in the core zone up to 5 yards in the North Shore zone. Delivery cost is always included in the price shown at checkout — no separate fee is added.",
    },
    {
      question: 'Will my driveway order need more than one truckload?',
      answer:
        'It depends on total tonnage — a typical single-car driveway usually fits in one load, while a long driveway or a full three-layer build may need two or more. Our calculator shows your exact tonnage.',
    },
    {
      question: 'Does ordering multiple loads cost more per ton?',
      answer:
        'Additional loads on the same delivery typically cost less than the first, since the first load covers most of the fixed delivery cost — see your live quote for the exact per-load breakdown.',
    },
    {
      question: 'Can a delivery truck access a narrow or long driveway?',
      answer:
        'Not always — very narrow, steep, or obstructed driveways may need a smaller truck or a drop-and-spread plan. Note any access constraints on your order so delivery can be planned accordingly.',
    },
    {
      question: 'Is there a maximum order size?',
      answer:
        'No practical maximum — large jobs are simply split across multiple truckloads, planned automatically by our pricing engine to minimize total delivery cost.',
    },
  ],
};
