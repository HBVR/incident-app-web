import Image from 'next/image';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <a href="/">
            <Image src="/logo-notifeo.png" alt="Notifeo" width={1000} height={400} className="h-10 w-auto" />
          </a>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-10 prose prose-gray">
        <h1>Politique de confidentialité</h1>
        <p><em>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</em></p>

        <h2>1. Responsable du traitement</h2>
        <p>
          HBVR, représentée par David SEVE, est responsable du traitement des données
          personnelles collectées via l&apos;application Notifeo.
        </p>

        <h2>2. Données collectées</h2>
        <p>Nous collectons les données suivantes :</p>
        <ul>
          <li><strong>Données d&apos;identification</strong> : nom, prénom, adresse email</li>
          <li><strong>Données de signalement</strong> : titre, description, photos, localisation des incidents</li>
          <li><strong>Données techniques</strong> : adresse IP, type de navigateur (logs serveur)</li>
        </ul>

        <h2>3. Finalités du traitement</h2>
        <ul>
          <li>Gestion de votre compte utilisateur</li>
          <li>Enregistrement et suivi des signalements d&apos;incidents</li>
          <li>Envoi d&apos;emails transactionnels (invitations, réinitialisation de mot de passe)</li>
          <li>Facturation et gestion des abonnements</li>
        </ul>

        <h2>4. Base légale</h2>
        <p>
          Le traitement est fondé sur l&apos;exécution du contrat (article 6.1.b du RGPD)
          lorsque vous utilisez notre service, et sur votre consentement pour les
          communications optionnelles.
        </p>

        <h2>5. Destinataires des données</h2>
        <p>Vos données sont accessibles uniquement :</p>
        <ul>
          <li>Aux membres de votre organisation (selon les rôles définis)</li>
          <li>À nos sous-traitants techniques : Supabase (hébergement DB, Europe), Vercel (hébergement web), Resend (envoi d&apos;emails), Stripe (paiement)</li>
        </ul>
        <p>Nous ne vendons ni ne partageons vos données avec des tiers à des fins commerciales.</p>

        <h2>6. Durée de conservation</h2>
        <ul>
          <li><strong>Données de compte</strong> : conservées tant que votre compte est actif, supprimées sous 30 jours après suppression du compte</li>
          <li><strong>Signalements et photos</strong> : conservés tant que l&apos;organisation est active</li>
          <li><strong>Données de facturation</strong> : conservées 10 ans (obligation légale)</li>
        </ul>

        <h2>7. Vos droits</h2>
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul>
          <li><strong>Droit d&apos;accès</strong> : obtenir une copie de vos données</li>
          <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
          <li><strong>Droit de suppression</strong> : supprimer votre compte et vos données (bouton &quot;Supprimer mon compte&quot; dans les paramètres)</li>
          <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
          <li><strong>Droit d&apos;opposition</strong> : vous opposer au traitement de vos données</li>
        </ul>
        <p>
          Pour exercer vos droits, contactez-nous à{' '}
          <a href="mailto:contact@notifeo.fr">contact@notifeo.fr</a>.
        </p>

        <h2>8. Sécurité</h2>
        <ul>
          <li>Chiffrement HTTPS sur toutes les communications</li>
          <li>Données hébergées en Europe (AWS eu-west-1, Irlande)</li>
          <li>Isolation des données par organisation (Row Level Security)</li>
          <li>Authentification sécurisée avec hachage des mots de passe</li>
          <li>Accès aux photos par URL signées temporaires (1h)</li>
        </ul>

        <h2>9. Cookies</h2>
        <p>
          Notifeo utilise uniquement des cookies techniques nécessaires au fonctionnement :
          session d&apos;authentification. Aucun cookie de tracking, analytics ou publicitaire.
        </p>

        <h2>10. Contact</h2>
        <p>
          Pour toute question relative à la protection de vos données :<br />
          <strong>HBVR — David SEVE</strong><br />
          Email : <a href="mailto:contact@notifeo.fr">contact@notifeo.fr</a>
        </p>
      </div>
    </main>
  );
}
