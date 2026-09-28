/** Whitespace-delimited word count, used to enforce the 40-60 word direct-answer rule. */
export const countWords = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length;
