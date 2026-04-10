'use client';

import { useEffect, useRef, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

export default function InstallButton() {
  const [showModal, setShowModal] = useState(false);
  const [canInstallNative, setCanInstallNative] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  // Detect browser
  const [browser, setBrowser] = useState<'chrome' | 'firefox' | 'safari' | 'other'>(
    'other'
  );
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Already installed as PWA?
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }

    // Detect browser
    const ua = navigator.userAgent.toLowerCase();
    if (/safari/.test(ua) && !/chrome/.test(ua)) setBrowser('safari');
    else if (/firefox/.test(ua)) setBrowser('firefox');
    else if (/chrome|chromium|edg/.test(ua)) setBrowser('chrome');

    // Chrome/Edge: capture the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstallNative(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleNativeInstall() {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    deferredPrompt.current = null;
    setCanInstallNative(false);
    setShowModal(false);
  }

  // Don't show if already installed as PWA
  if (isStandalone) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
        title="Options"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25"
          />
        </svg>
        Installer
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">
                Installer Notifeo
              </h2>
              <p className="text-sm text-gray-600">
                Ajoutez Notifeo à votre écran d&apos;accueil pour un accès
                rapide, comme une application native.
              </p>

              {/* Chrome/Edge: native install */}
              {canInstallNative && (
                <button
                  onClick={handleNativeInstall}
                  className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white hover:bg-blue-700"
                >
                  Installer Notifeo
                </button>
              )}

              {/* Browser-specific instructions */}
              {!canInstallNative && (
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-3">
                  {browser === 'chrome' && (
                    <>
                      <p className="font-semibold text-gray-900">Chrome / Edge</p>
                      <ol className="text-sm text-gray-700 space-y-1 list-decimal pl-4">
                        <li>Appuyez sur le menu <strong>⋮</strong> (3 points en haut à droite)</li>
                        <li>Sélectionnez <strong>&quot;Installer l&apos;application&quot;</strong></li>
                        <li>Confirmez l&apos;installation</li>
                      </ol>
                    </>
                  )}
                  {browser === 'firefox' && (
                    <>
                      <p className="font-semibold text-gray-900">Firefox</p>
                      <p className="text-sm text-gray-700">
                        Firefox ne supporte pas l&apos;installation PWA directement.
                        Pour la meilleure expérience :
                      </p>
                      <ol className="text-sm text-gray-700 space-y-1 list-decimal pl-4">
                        <li>Ouvrez <strong>app.notifeo.fr</strong> dans <strong>Chrome</strong> ou <strong>Edge</strong></li>
                        <li>Menu ⋮ → <strong>&quot;Installer l&apos;application&quot;</strong></li>
                      </ol>
                      <p className="text-xs text-gray-500 mt-2">
                        Ou sur Android : menu ⋮ → <strong>&quot;Ajouter à l&apos;écran d&apos;accueil&quot;</strong>
                        (fonctionne dans Firefox mais sans le mode plein écran)
                      </p>
                    </>
                  )}
                  {browser === 'safari' && (
                    <>
                      <p className="font-semibold text-gray-900">Safari (iPhone / iPad)</p>
                      <ol className="text-sm text-gray-700 space-y-1 list-decimal pl-4">
                        <li>Appuyez sur le bouton <strong>Partage</strong> (carré avec flèche ↑)</li>
                        <li>Scrollez et sélectionnez <strong>&quot;Sur l&apos;écran d&apos;accueil&quot;</strong></li>
                        <li>Appuyez <strong>&quot;Ajouter&quot;</strong></li>
                      </ol>
                    </>
                  )}
                  {browser === 'other' && (
                    <>
                      <p className="font-semibold text-gray-900">Installation</p>
                      <p className="text-sm text-gray-700">
                        Ouvrez <strong>app.notifeo.fr</strong> dans Chrome, Edge ou Safari
                        et utilisez l&apos;option &quot;Installer&quot; ou &quot;Ajouter à l&apos;écran d&apos;accueil&quot;
                        du menu de votre navigateur.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-3">
              <button
                onClick={() => setShowModal(false)}
                className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
