'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Detects an invite/signup token in the URL hash and redirects to /welcome.
 * Mounted globally in the root layout so it runs on every route.
 */
export default function InviteRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (pathname === '/welcome') return;

    const hash = window.location.hash;
    if (!hash) return;

    if (hash.includes('type=invite') || hash.includes('type=signup')) {
      // Préserve le hash pour que la page /welcome puisse récupérer la session
      router.replace('/welcome' + hash);
    }
  }, [pathname, router]);

  return null;
}
