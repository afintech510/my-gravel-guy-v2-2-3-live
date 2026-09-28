import { Badge } from '@/components/ui/badge';
import type { Metro } from '../../types';

const LABEL: Record<Metro['status'], string> = {
  live: 'Now delivering',
  pilot: 'Pilot',
  'coming-soon': 'Launching soon',
};

export function MetroStatusBadge({ status, className }: { status: Metro['status']; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={`bg-primary/15 border-primary/40 text-[#0F1115] font-semibold ${className ?? ''}`}
    >
      {LABEL[status]}
    </Badge>
  );
}
