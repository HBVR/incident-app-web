'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function UserMenu() {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowDeleteConfirm(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    const resp = await fetch('/api/delete-account', { method: 'POST' });
    const result = await resp.json();
    if (!resp.ok) {
      alert(result.error || 'Erreur');
      setDeleting(false);
      return;
    }
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-64 rounded-xl border border-gray-200 bg-white shadow-lg z-50">
          {!showDeleteConfirm ? (
            <>
              <a
                href="/settings/billing"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl"
              >
                <span className="text-base">💳</span>
                Abonnement
              </a>
              <a
                href="/legal"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="text-base">📄</span>
                Mentions légales
              </a>
              <a
                href="/privacy"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="text-base">🔒</span>
                Politique de confidentialité
              </a>
              <div className="border-t border-gray-100" />
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="text-base">🚪</span>
                Déconnexion
              </button>
              <div className="border-t border-gray-100" />
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-b-xl"
              >
                <span className="text-base">⚠️</span>
                Supprimer mon compte
              </button>
            </>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold text-red-700">
                Supprimer votre compte ?
              </p>
              <p className="text-xs text-gray-600">
                Cette action est irréversible. Toutes vos données seront supprimées.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Suppression...' : 'Confirmer'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-xs font-medium text-gray-700"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
