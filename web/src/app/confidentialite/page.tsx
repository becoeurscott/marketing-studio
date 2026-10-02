import type { Metadata } from "next";
import { LegalPage, Publisher } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" intro={`Cette politique explique quelles données ${LEGAL.brand} collecte, pourquoi, avec qui elles sont partagées et quels sont vos droits.`}>
      <section><h2>1. Responsable du traitement</h2><Publisher /></section>
      <section>
        <h2>2. Données collectées</h2>
        <ul>
          <li>Compte : nom, adresse e-mail, mot de passe (chiffré) ou connexion Google.</li>
          <li>Utilisation : projets, marques, photos de produits importées, textes saisis, contenus générés, historique des crédits.</li>
          <li>Paiement : numéro de téléphone Mobile Money, montant, opérateur et statut du paiement. Nous ne voyons jamais votre code secret.</li>
          <li>Technique : adresse IP, type d&apos;appareil, journaux d&apos;erreurs, utilisés pour la sécurité et la lutte contre la fraude.</li>
        </ul>
      </section>
      <section>
        <h2>3. Pourquoi</h2>
        <ul>
          <li>Fournir le service : créer vos contenus, sauvegarder vos projets, gérer vos crédits.</li>
          <li>Encaisser vos paiements et éviter la fraude (par exemple la création de comptes multiples).</li>
          <li>Vous contacter au sujet de votre compte (assistance, sécurité).</li>
        </ul>
      </section>
      <section>
        <h2>4. Prestataires</h2>
        <p>Vos données sont traitées par des prestataires qui agissent pour notre compte :</p>
        <ul>
          <li>InsForge : hébergement de la base de données, des comptes et des fichiers (serveurs en Europe).</li>
          <li>Higgsfield : génération des images et vidéos à partir de vos instructions et photos.</li>
          <li>pawaPay : traitement des paiements Mobile Money.</li>
          <li>Vercel : hébergement du site.</li>
          <li>Google : connexion avec un compte Google, si vous la choisissez.</li>
        </ul>
        <p className="mt-2">Certaines données sont donc transférées hors de votre pays, avec les garanties prévues par ces prestataires. Nous ne vendons pas vos données.</p>
      </section>
      <section>
        <h2>5. Durée de conservation</h2>
        <ul>
          <li>Compte et contenus : tant que votre compte est actif, puis supprimés dans les 30 jours suivant sa suppression.</li>
          <li>Paiements et historique des crédits : conservés le temps exigé par les obligations comptables.</li>
        </ul>
      </section>
      <section>
        <h2>6. Vos droits</h2>
        <p>Vous pouvez accéder à vos données, les corriger, les supprimer ou vous opposer à leur traitement, conformément à la loi ivoirienne n° 2013-450 relative à la protection des données personnelles et, selon votre pays, à la loi sénégalaise n° 2008-12 ou aux textes équivalents. Écrivez-nous à {LEGAL.supportEmail}. Vous pouvez aussi saisir l&apos;autorité de protection de votre pays (ARTCI en Côte d&apos;Ivoire, CDP au Sénégal).</p>
      </section>
      <section>
        <h2>7. Sécurité</h2>
        <p>Les accès sont chiffrés (HTTPS), les mots de passe ne sont jamais stockés en clair et les clés des prestataires restent sur nos serveurs.</p>
      </section>
    </LegalPage>
  );
}
