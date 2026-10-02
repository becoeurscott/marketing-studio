import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Politique de remboursement" };

export default function RemboursementPage() {
  return (
    <LegalPage title="Politique de remboursement" intro={`Chez ${LEGAL.brand}, vous payez des crédits, pas un abonnement. Voici quand et comment ils vous sont rendus.`}>
      <section>
        <h2>1. Génération qui échoue</h2>
        <p>Si une génération échoue, expire ou est bloquée par la modération, les crédits sont rendus automatiquement sur votre compte. Vous le voyez dans l&apos;historique de vos crédits (« Remboursement »).</p>
      </section>
      <section>
        <h2>2. Résultat de mauvaise qualité</h2>
        <p>Si un résultat est manifestement inutilisable (produit déformé, texte illisible, vidéo coupée), écrivez-nous dans les 7 jours avec le nom de la création. Après vérification, nous recréditons votre compte.</p>
      </section>
      <section>
        <h2>3. Problème de paiement</h2>
        <ul>
          <li>Montant débité mais crédits non reçus : écrivez-nous avec la date, le montant et votre numéro. Nous vérifions avec pawaPay et ajoutons les crédits, ou remboursons le paiement.</li>
          <li>Double débit : le paiement en trop est remboursé sur votre compte Mobile Money.</li>
        </ul>
      </section>
      <section>
        <h2>4. Crédits non utilisés</h2>
        <p>Les crédits achetés n&apos;expirent pas. Ils ne sont pas remboursables en argent, sauf obligation légale ou erreur de notre part. Les crédits offerts (bienvenue, promotions) ne sont jamais remboursables.</p>
      </section>
      <section>
        <h2>5. Nous contacter</h2>
        <p>{LEGAL.supportEmail} : nous répondons sous 48 h ouvrées.</p>
      </section>
    </LegalPage>
  );
}
