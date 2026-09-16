export default function TexturedPortal() {
  return <svg className="portal" aria-hidden="true" preserveAspectRatio="none">
    <defs>
      <filter id="grain-edge" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".12" numOctaves="2" seed="12" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter>
    </defs>
    <path className="portal-edge" fill="none" stroke="#b6b4a5" strokeWidth="3" opacity=".42" filter="url(#grain-edge)"/>
  </svg>;
}
