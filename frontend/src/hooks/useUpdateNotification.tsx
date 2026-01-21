import { useState } from 'react';

let notificationTimeout: number | null = null;

export function useUpdateNotification() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const showUpdateStart = () => {
    if (notificationTimeout) clearTimeout(notificationTimeout);
    setIsUpdating(true);
    setShowSuccess(false);
  };

  const showUpdateComplete = () => {
    setIsUpdating(false);
    setShowSuccess(true);
    
    if (notificationTimeout) clearTimeout(notificationTimeout);
    notificationTimeout = window.setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  return { isUpdating, showSuccess, showUpdateStart, showUpdateComplete };
}

interface UpdateIndicatorProps {
  isUpdating: boolean;
  showSuccess: boolean;
}

export function UpdateIndicator({ isUpdating, showSuccess }: UpdateIndicatorProps) {
  if (!isUpdating && !showSuccess) return null;

  return (
    <div className={`update-indicator ${showSuccess ? 'success' : ''}`}>
      {isUpdating ? (
        <>
          <div className="update-indicator-spinner" />
          <span className="update-indicator-text">Updating...</span>
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--online-color)' }}>
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
          <span className="update-indicator-text">Updated</span>
        </>
      )}
    </div>
  );
}
