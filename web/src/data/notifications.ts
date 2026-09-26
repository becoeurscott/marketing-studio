import type { Notification, NotificationKind } from "@/lib/types";
import { daysAgo } from "@/lib/utils";

type R = [NotificationKind, string, string, string | undefined, number, boolean];
const rows: R[] = [
  ["generation-complete", "Vos images sont prêtes", "La génération de 4 photos produit pour le sérum Luma Glow est terminée.", "/generations", 0, false],
  ["campaign-ready", "Lancement été Luma Glow est prête", "Les 5 formats ont été générés. Consultez l'espace de la campagne.", "/campaigns/camp_luma_summer", 0, false],
  ["credits-low", "Crédits bientôt épuisés", "Il vous reste 1 250 crédits. Chaque génération vidéo coûte 50 crédits.", "/credits", 1, false],
  ["export-complete", "Export terminé", "Lancement été — carrousel IG.zip est prêt à télécharger.", "/assets", 1, true],
  ["new-template", "Nouveau modèle : Routine skincare GRWM", "Un nouveau modèle UGC a été ajouté à Beauté.", "/templates/tpl_22", 2, true],
  ["project-shared", "Sarah a partagé un projet avec vous", "Série TikTok cold brew est désormais partagé avec votre espace de travail.", "/projects/proj_coldbrew_tiktok", 2, true],
  ["generation-complete", "Rendu vidéo terminé", "Orbite lente autour du flacon de sérum (10 s) est prête.", "/generations", 3, true],
  ["campaign-ready", "Test d'accroches UGC — Sérum mis à jour", "4 nouvelles variantes ont été ajoutées.", "/campaigns/camp_ugc_test", 3, true],
  ["export-complete", "Export terminé", "Pubs UGC — TikTok.mp4 exporté en qualité maximale.", "/assets", 4, true],
  ["generation-complete", "Texte généré", "10 accroches pour l'UGC TikTok sont prêtes à être relues.", "/generations", 4, true],
  ["new-template", "Nouveau modèle : Film produit cinématique", "Essayez-le dans le Studio avec votre photo produit.", "/templates/tpl_21", 5, true],
  ["project-shared", "Michael a commenté Campagne montre de luxe", "« J'adore la macro du cadran — on peut avoir une version 16:9 ? »", "/projects/proj_watch", 6, true],
  ["generation-complete", "Shooting produit terminé", "6 photos en décor pour SPF 50 Daily Shield.", "/generations", 6, true],
  ["credits-low", "Crédits rechargés", "1 000 crédits ont été ajoutés à votre compte.", "/credits", 7, true],
  ["campaign-ready", "Lancement vêtements de fitness terminée", "Campagne terminée avec un CTR de 2,4 %.", "/campaigns/camp_fitness_drop", 8, true],
  ["export-complete", "Export terminé", "Présentation campagne.pdf est prêt.", "/assets", 9, true],
  ["generation-complete", "Variantes de pub prêtes", "Créas A–D pour le carrousel Instagram.", "/generations", 10, true],
  ["new-template", "Nouveau modèle : Carrousel avant/après", "Mises en page axées sur la preuve pour Beauté.", "/templates/tpl_11", 11, true],
  ["project-shared", "Sarah a rejoint votre espace de travail", "Sarah Kim a accepté l'invitation Admin.", "/workspace", 12, true],
  ["generation-complete", "Rendu vidéo terminé", "Travelling avant sur le versement de cold brew (5 s) est prêt.", "/generations", 13, true],
  ["campaign-ready", "Série éditoriale montres terminée", "Les statistiques finales sont disponibles.", "/campaigns/camp_watch_editorial", 14, true],
  ["export-complete", "Export terminé", "Reel montre — 4K.mp4 est terminé.", "/assets", 15, true],
];

export const notifications: Notification[] = rows.map(([kind, title, body, href, d, read], i) => ({
  id: `notif_${i + 1}`,
  kind, title, body, href, read,
  createdAt: daysAgo(d, 18 - (i % 9)),
}));
