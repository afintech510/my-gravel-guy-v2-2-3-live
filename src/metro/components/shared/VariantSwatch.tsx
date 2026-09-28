interface VariantSwatchProps {
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<VariantSwatchProps['size']>, string> = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

/** Swatch stand-in used until real product photography is in place. */
export function VariantSwatch({ color, size = 'md', className }: VariantSwatchProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full border border-black/10 shadow-inner ${SIZE_CLASSES[size]} ${className ?? ''}`}
      style={{ backgroundColor: color }}
    />
  );
}
