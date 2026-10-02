import type { Metadata } from "next";
import { LegalPage, Publisher } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function ConditionsPage() {
  return (
    <LegalPage title="Conditions d'utilisation" intro={`Ces conditions encadrent l'utilisation de ${LEGAL.brand}, le studio marketing qui crée des photos, vidéos, publicités et textes pour vos produits à l'aide de l'intelligence artificielle. En créant un compte, vous les acceptez.`}>
      <section><h2>1. Éditeur du service</h2><Publisher /></section>
      <section>
        <h2>2. Le service</h2>
        <p>{LEGAL.brand} génère des contenus marketing à partir de vos instructions et de vos photos de produits, grâce à des modèles d&apos;intelligence artificielle fournis par des prestataires (notamment Higgsfield). Les résultats sont produits automatiquement : ils peuvent contenir des imperfections et doivent être relus avant publication.</p>
      </section>
      <section>
        <h2>3. Compte</h2>
        <ul>
          <li>Vous devez fournir une adresse e-mail valide et la confirmer. Un compte est personnel.</li>
          <li>Les crédits de bienvenue sont offerts une seule fois par personne. La création de comptes multiples pour les obtenir est interdite et peut entraîner la suppression des comptes concernés.</li>
          <li>Vous êtes responsable de la confidentialité de vos accès.</li>
        </ul>
      </section>
      <section>
        <h2>4. Crédits et paiement</h2>
        <ul>
          <li>Chaque génération consomme des crédits ; le coût est affiché avant de lancer la génération.</li>
          <li>Les crédits s&apos;achètent par packs, en Mobile Money, via notre prestataire de paiement pawaPay. Il n&apos;y a pas d&apos;abonnement.</li>
          <li>Les crédits achetés n&apos;expirent pas et ne sont ni remboursables en argent ni transférables, sauf dans les cas prévus par la politique de remboursement.</li>
          <li>Si une génération échoue ou est bloquée par la modération, ses crédits sont rendus automatiquement.</li>
        </ul>
      </section>
      <section>
        <h2>5. Vos contenus et vos responsabilités</h2>
        <ul>
          <li>Vous garantissez détenir les droits sur les photos et textes que vous importez (photos de vos produits, logos, marques).</li>
          <li>Vous êtes responsable des contenus que vous publiez et des promesses faites sur vos produits (prix, effets, qualité). Les contenus ne doivent pas tromper le consommateur.</li>
          <li>Sont interdits : les contenus illégaux, haineux, violents, à caractère sexuel, portant atteinte à la vie privée ou aux droits d&apos;autrui, et la promotion de produits interdits ou contrefaits.</li>
          <li>Les créateurs virtuels proposés dans {LEGAL.brand} sont générés par IA ; vous ne devez pas les présenter comme de vraies personnes ayant testé votre produit.</li>
        </ul>
      </section>
      <section>
        <h2>6. Propriété des contenus générés</h2>
        <p>Sous réserve des présentes conditions et des conditions des fournisseurs de modèles, vous pouvez utiliser librement, y compris commercialement, les contenus générés avec votre compte. {LEGAL.brand} peut, avec votre accord, présenter certaines créations comme exemples.</p>
      </section>
      <section>
        <h2>7. Disponibilité et responsabilité</h2>
        <p>Nous faisons notre possible pour que le service fonctionne en continu, sans pouvoir le garantir. {LEGAL.brand} ne peut être tenu responsable des pertes indirectes (ventes manquées, par exemple). Notre responsabilité est limitée au montant payé au cours des trois derniers mois.</p>
      </section>
      <section>
        <h2>8. Suspension et résiliation</h2>
        <p>Vous pouvez supprimer votre compte à tout moment. En cas de non-respect de ces conditions, nous pouvons suspendre ou supprimer un compte, après information lorsque c&apos;est possible.</p>
      </section>
      <section>
        <h2>9. Droit applicable</h2>
        <p>Ces conditions sont soumises au droit de {LEGAL.country}. En cas de litige, nous chercherons d&apos;abord une solution amiable ; à défaut, les tribunaux compétents de {LEGAL.country} seront saisis. Contact : {LEGAL.supportEmail}.</p>
      </section>
    </LegalPage>
  );
}
