import React, { useEffect, useState } from 'react';

const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      id="offline-banner"
      className="fixed top-0 left-0 right-0 bg-yellow-500 text-white py-2 px-4 text-center z-50"
    >
      你当前处于离线状态。某些功能可能无法使用。
    </div>
  );
};

export default OfflineBanner;
