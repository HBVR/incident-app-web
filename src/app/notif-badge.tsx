'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const POLL_INTERVAL = 15000; // 15 secondes
const STORAGE_KEY = 'notifeo_last_seen';
const ORIGINAL_TITLE = 'Notifeo — Signalez, notifiez, résolvez';

function playNotifSound() {
  // Générer un WAV "ding" en mémoire (44100Hz, 0.4s, 2 notes)
  const sampleRate = 44100;
  const duration = 0.4;
  const samples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples * 2, true);

  // Generate two-tone ding
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 8);
    const freq1 = 880;
    const freq2 = 1320;
    const mix = t < 0.15
      ? Math.sin(2 * Math.PI * freq1 * t)
      : Math.sin(2 * Math.PI * freq2 * t);
    const sample = Math.floor(mix * envelope * 16000);
    view.setInt16(44 + i * 2, sample, true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.volume = 0.6;
  audio.play().catch(() => {});
  audio.onended = () => URL.revokeObjectURL(url);
}

export default function NotifBadge() {
  const pathname = usePathname();
  const originalFaviconRef = useRef<string>('/icon.png');
  const badgeFaviconRef = useRef<string | null>(null);
  const prevCountRef = useRef<number>(0);
  const hasInteractedRef = useRef<boolean>(false);

  // Détecter la première interaction (requis pour jouer du son)
  useEffect(() => {
    const mark = () => { hasInteractedRef.current = true; };
    // Écouter TOUS les types d'interactions
    const events = ['click', 'keydown', 'touchstart', 'mousedown', 'scroll'];
    events.forEach((e) => window.addEventListener(e, mark, { once: true, passive: true }));
    // Si la page est déjà focus, considérer comme interagi après 2s
    const timer = setTimeout(() => { hasInteractedRef.current = true; }, 2000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, mark));
      clearTimeout(timer);
    };
  }, []);

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
          // Nouvelles notifs non lues → badge rouge + titre + son
          if (count > prevCountRef.current && hasInteractedRef.current) {
            playNotifSound();
          }
          prevCountRef.current = count;
          document.title = `(${count}) Notifeo`;
          const badgeUrl = await generateBadgeFavicon();
          setFavicon(badgeUrl);
        } else {
          prevCountRef.current = 0;
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
