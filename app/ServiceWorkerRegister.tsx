'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // インストール要件の一つなので失敗しても機能自体は問題なく動く
      });
    }
  }, []);
  return null;
}
