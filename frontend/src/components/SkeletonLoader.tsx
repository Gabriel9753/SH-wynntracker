export function ChartSkeleton() {
  return (
    <div className="chart-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-bar skeleton-title" />
        <div className="skeleton-bar skeleton-controls" />
      </div>
      <div className="skeleton-chart">
        <div className="skeleton-axis-y">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-bar skeleton-label" />
          ))}
        </div>
        <div className="skeleton-graph">
          <svg width="100%" height="220" className="skeleton-svg">
            <defs>
              <linearGradient id="skeleton-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--border-color)" stopOpacity="0.3">
                  <animate
                    attributeName="stop-opacity"
                    values="0.3;0.6;0.3"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="50%" stopColor="var(--border-color)" stopOpacity="0.6">
                  <animate
                    attributeName="stop-opacity"
                    values="0.6;0.9;0.6"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="100%" stopColor="var(--border-color)" stopOpacity="0.3">
                  <animate
                    attributeName="stop-opacity"
                    values="0.3;0.6;0.3"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </stop>
              </linearGradient>
            </defs>
            <path
              d="M 0 180 Q 50 120, 100 140 T 200 100 T 300 130 T 400 90 T 500 110 T 600 80"
              fill="none"
              stroke="url(#skeleton-gradient)"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
      <div className="skeleton-axis-x">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton-bar skeleton-label-small" />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-6">
      <div className="skeleton-bar skeleton-title mb-4" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex justify-between py-2.5 border-b border-[var(--border-color)]">
          <div className="skeleton-bar skeleton-label" style={{ width: '40%' }} />
          <div className="skeleton-bar skeleton-label" style={{ width: '30%' }} />
        </div>
      ))}
    </div>
  );
}
