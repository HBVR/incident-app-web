'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const POLL_INTERVAL = 15000; // 15 secondes
const STORAGE_KEY = 'notifeo_last_seen';
const ORIGINAL_TITLE = 'Notifeo — Signalez, notifiez, résolvez';

export default function NotifBadge() {
  const pathname = usePathname();
  const originalFaviconRef = useRef<string>('/icon.png');
  const badgeFaviconRef = useRef<string | null>(null);

  // Marquer comme lu quand on visite la page Notifs (/)
  useEffect(() => {
    if (pathname === '/') {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      // Reset le titre et favicon
      document.title = ORIGINAL_TITLE;
      setFavicon(originalFaviconRef.current);
    }
  }, [pathname]);

  // Générer le favicon avec badge rouge via Canvas
  const generateBadgeFavicon = useCallback(async (): Promise<string> => {
    if (badgeFaviconRef.current) return badgeFaviconRef.current;

    const img = new Image();
    img.src = '/icon.png';

    return new Promise((resolve) => {
      img.onload = () => {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        // Dessiner l'icône originale
        ctx.drawImage(img, 0, 0, size, size);

        // Dessiner le badge rouge
        const badgeRadius = 12;
        const x = size - badgeRadius - 2;
        const y = badgeRadius + 2;
        ctx.beginPath();
        ctx.arc(x, y, badgeRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        const dataUrl = canvas.toDataURL('image/png');
        badgeFaviconRef.current = dataUrl;
        resolve(dataUrl);
      };
      img.onerror = () => resolve('/icon.png');
    });
  }, []);

  // Poll pour les nouvelles notifs
  useEffect(() => {
    let active = true;

    async function check() {
      if (!active) return;
      const since = localStorage.getItem(STORAGE_KEY);
      if (!since) {
        // Premier visit, marquer maintenant
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
        return;
      }

      try {
        const resp = await fetch(`/api/usage?since=${encodeURIComponent(since)}`);
        if (!resp.ok) return;
        const data = await resp.json();
        const count = data.newNotifs ?? 0;

        if (count > 0 && pathname !== '/') {
          // Nouvelles notifs non lues → badge rouge + titre
          document.title = `(${count}) Notifeo`;
          const badgeUrl = await generateBadgeFavicon();
          setFavicon(badgeUrl);
        } else {
          // Pas de nouvelles notifs → normal
          document.title = ORIGINAL_TITLE;
          setFavicon(originalFaviconRef.current);
        }
      } catch {}
    }

    check();
    const interval = setInterval(check, POLL_INTERVAL);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [pathname, generateBadgeFavicon]);

  return null;
}

function setFavicon(url: string) {
  // Supprimer tous les favicons existants (y compris ceux générés par Next.js)
  document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]').forEach((el) => el.remove());

  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = url;
  document.head.appendChild(link);
}
