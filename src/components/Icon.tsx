import * as L from 'lucide-react';
export default function Icon({ name, size = 18, className = '' }: { name: string; size?: number; className?: string }) {
  const C = (L as any)[name] ?? L.Circle; return <C size={size} className={className} aria-hidden="true" strokeWidth={1.75} />;
}
