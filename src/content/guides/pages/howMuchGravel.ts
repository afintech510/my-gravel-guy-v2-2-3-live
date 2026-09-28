import type { GuideContent } from '../types';

export const howMuchGravel: GuideContent = {
  slug: 'how-much-gravel',
  path: '/gravel-driveways/how-much-gravel',
  navLabel: 'Calculator',
  title: 'Gravel Driveway Calculator: Tons & Yards | MyGravelGuy',
  description:
    'Calculate how many tons or yards of gravel your driveway needs from length, width and depth, with live delivered pricing.',
  h1: 'How Much Gravel Do I Need for My Driveway?',
  directAnswer:
    "Multiply length by width by depth in feet, divide by 27 for cubic yards, then convert using your material's tons per cubic yard, typically 1.3 to 1.5 for gravel. A 12 by 50 foot driveway at 4 inches deep needs roughly 7.4 cubic yards, about 10 to 11 tons. Use the calculator below for your exact dimensions and material.",
  howWeKnow:
    "This calculator uses the same length-times-width-times-depth math Eastern LM's yard team uses to plan real driveway deliveries, converted with each material's actual tons-per-yard ratio rather than a generic estimate.",
  lastUpdated: '2026-09-28',
  faqs: [
    {
      question: 'How many tons of gravel do I need for a 100 foot driveway?',
      answer:
        'A 100 by 12 foot driveway (1,200 square feet) at 4 inches deep needs about 15 cubic yards, roughly 20 to 22 tons of gravel. At 6 inches deep, that rises to about 22 cubic yards, roughly 30 tons.',
    },
    {
      question: 'How much does a ton of gravel cover?',
      answer:
        "One ton of gravel covers roughly 100 square feet at 2 inches deep, 80 square feet at 3 inches, 60 square feet at 4 inches, and about 33 square feet at 6 inches deep, depending on the stone's size and shape.",
    },
    {
      question: 'Should I order extra gravel beyond my calculated amount?',
      answer:
        "Yes — order about 5 to 10 percent extra to cover settling, compaction loss, and an uneven base, especially on a driveway you're building for the first time.",
    },
    {
      question: 'Do tons and cubic yards convert the same way for every material?',
      answer:
        'No. Each material has its own tons-per-yard ratio — dense stone like gravel runs about 1.3 to 1.5 tons per yard, while lighter material like mulch is closer to 0.3 tons per yard. Always use the specific material\'s ratio, not a generic one.',
    },
  ],
};
