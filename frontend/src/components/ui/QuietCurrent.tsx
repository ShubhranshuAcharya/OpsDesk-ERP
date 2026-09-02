import './QuietCurrent.css';

export function QuietCurrent() {
  return (
    <div className="wave-container" aria-hidden="true">
      <svg className="wave wave-back" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="var(--color-wave-back)" fillOpacity="0.08"
          d="M0,160 C240,220 480,100 720,160 C960,220 1200,100 1440,160
             C1680,220 1920,100 2160,160 L2160,320 L0,320 Z" />
      </svg>
      <svg className="wave wave-mid" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="var(--color-wave-mid)" fillOpacity="0.10"
          d="M0,180 C240,120 480,240 720,180 C960,120 1200,240 1440,180
             C1680,120 1920,240 2160,180 L2160,320 L0,320 Z" />
      </svg>
      <svg className="wave wave-front" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="var(--color-wave-front)" fillOpacity="0.12"
          d="M0,200 C240,260 480,140 720,200 C960,260 1200,140 1440,200
             C1680,260 1920,140 2160,200 L2160,320 L0,320 Z" />
      </svg>
    </div>
  );
}
