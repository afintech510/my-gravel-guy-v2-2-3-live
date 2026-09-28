// Typed content model for the Gravel Driveway Hub guides. Keeping copy as typed data
// (rather than inline JSX strings) lets vitest assert invariants like "every direct
// answer is 40-60 words" without needing to render each page.

export interface GuideFaq {
  question: string;
  answer: string;
}

export interface GuideHowToStep {
  name: string;
  text: string;
}

export interface GuideContent {
  /** '' for the hub; otherwise the URL segment after /gravel-driveways/ */
  slug: string;
  /** Full site-relative path, e.g. '/gravel-driveways/cost' */
  path: string;
  /** Short label used in sibling-link lists */
  navLabel: string;
  /** <=60 chars — rendered verbatim in <title> */
  title: string;
  /** <=155 chars — rendered verbatim in <meta name="description"> */
  description: string;
  /** Page H1, phrased as the question this page answers */
  h1: string;
  /** Self-contained 40-60 word answer, meant to be quotable verbatim by AI answer engines */
  directAnswer: string;
  /** Short E-E-A-T line referencing real, verifiable delivery experience — no invented stats */
  howWeKnow: string;
  /** ISO date (YYYY-MM-DD) — used for Article datePublished/dateModified and the visible "Last updated" line */
  lastUpdated: string;
  faqs: GuideFaq[];
  /** Present only on pages that also render a HowTo schema block (maintenance) */
  howToSteps?: GuideHowToStep[];
}
