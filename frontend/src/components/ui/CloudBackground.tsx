import './CloudBackground.css';

export function CloudBackground() {
  return (
    <div className="cloud-container" aria-hidden="true">
      {/* Back Layer */}
      <svg className="cloud-layer cloud-back" viewBox="0 0 2000 320" preserveAspectRatio="none">
        <rect x="0" y="240" width="2000" height="80" />
        
        {/* Set 1: 0 to 1000 */}
        <ellipse cx="0" cy="240" rx="300" ry="120" />
        <ellipse cx="400" cy="250" rx="250" ry="100" />
        <ellipse cx="800" cy="260" rx="280" ry="110" />

        {/* Set 2: 1000 to 2000 */}
        <ellipse cx="1000" cy="240" rx="300" ry="120" />
        <ellipse cx="1400" cy="250" rx="250" ry="100" />
        <ellipse cx="1800" cy="260" rx="280" ry="110" />
        
        {/* Set 3: 2000+ (for boundary crossing) */}
        <ellipse cx="2000" cy="240" rx="300" ry="120" />
      </svg>
      
      {/* Mid Layer */}
      <svg className="cloud-layer cloud-mid" viewBox="0 0 2000 320" preserveAspectRatio="none">
        <rect x="0" y="270" width="2000" height="50" />
        
        {/* Set 1: 0 to 1000 */}
        <ellipse cx="150" cy="275" rx="220" ry="90" />
        <ellipse cx="600" cy="280" rx="260" ry="100" />
        <ellipse cx="950" cy="270" rx="200" ry="80" />

        {/* Set 2: 1000 to 2000 */}
        <ellipse cx="1150" cy="275" rx="220" ry="90" />
        <ellipse cx="1600" cy="280" rx="260" ry="100" />
        <ellipse cx="1950" cy="270" rx="200" ry="80" />

        {/* Boundary at 2000+ */}
        <ellipse cx="2150" cy="275" rx="220" ry="90" />
      </svg>
      
      {/* Front Layer */}
      <svg className="cloud-layer cloud-front" viewBox="0 0 2000 320" preserveAspectRatio="none">
        <rect x="0" y="295" width="2000" height="25" />
        
        {/* Set 1: 0 to 1000 */}
        <ellipse cx="50" cy="300" rx="150" ry="60" />
        <ellipse cx="450" cy="295" rx="200" ry="70" />
        <ellipse cx="850" cy="305" rx="180" ry="65" />

        {/* Set 2: 1000 to 2000 */}
        <ellipse cx="1050" cy="300" rx="150" ry="60" />
        <ellipse cx="1450" cy="295" rx="200" ry="70" />
        <ellipse cx="1850" cy="305" rx="180" ry="65" />

        {/* Boundary at 2000+ */}
        <ellipse cx="2050" cy="300" rx="150" ry="60" />
      </svg>
    </div>
  );
}
