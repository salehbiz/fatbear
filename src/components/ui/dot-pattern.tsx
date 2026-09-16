import { useId, type SVGProps } from 'react';

export interface DotPatternProps extends SVGProps<SVGSVGElement> {
  spacing?: number;
  radius?: number;
}

export function DotPattern({ spacing = 26, radius = 1.2, className = '', ...props }: DotPatternProps) {
  const id = useId();
  return <svg {...props} className={`dot-pattern ${className}`} aria-hidden="true" focusable="false">
    <defs><pattern id={id} width={spacing} height={spacing} patternUnits="userSpaceOnUse">
      <circle cx={spacing / 2} cy={spacing / 2} r={radius} />
    </pattern></defs>
    <rect width="100%" height="100%" fill={`url(#${id})`} />
  </svg>;
}
