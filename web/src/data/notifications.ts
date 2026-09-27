import type { Notification, NotificationKind } from "@/lib/types";
import { daysAgo } from "@/lib/utils";

type R = [NotificationKind, string, string, string | undefined, number, boolean];
const rows: R[] = [
  ["generation-complete", "Vos images sont prêtes", "Les 4 photos produit du beurre de karité pur sont terminées.", "/generations", 0, false],
  ["campaign-ready", "Lancement beurre de karité pur est prête", "Les 5 formats ont été générés, dont vos statuts WhatsApp. Consultez l'espace de la campagne.", "/campaigns/camp_luma_summer", 0, false],
  ["credits-low", "Crédits bientôt épuisés", "Il vous reste 1 250 crédits. Chaque génération vidéo coûte 50 crédits.", "/credits", 1, false],
  ["export-complete", "Export terminé", "Lancement karité — statuts WhatsApp.zip est prêt à télécharger.", "/assets", 1, true],
  ["new-template", "Nouveau modèle : Routine karité du soir", "Un nouveau modèle UGC a été ajouté à Beauté.", "/templates/tpl_22", 2, true],
  ["project-shared", "Mariam a partagé un projet avec vous", "Série TikTok attiéké poisson braisé est désormais partagé avec votre espace de travail.", "/projects/proj_coldbrew_tiktok", 2, true],
  ["generation-complete", "Rendu vidéo terminé", "Rotation lente autour du pot de karité (10 s) est prête.", "/generations", 3, true],
  ["campaign-ready", "Test d'accroches témoignages — Karité mis à jour", "4 nouvelles variantes ont été ajoutées.", "/campaigns/camp_ugc_test", 3, true],
  ["export-complete", "Export terminé", "Témoignages — TikTok.mp4 exporté en qualité maximale.", "/assets", 4, true],
  ["generation-complete", "Texte généré", "10 accroches pour les vidéos témoignages sont prêtes à être relues.", "/generations", 4, true],
  ["new-template", "Nouveau modèle : Vidéo produit cinématique", "Essayez-le dans le Studio avec la photo de votre produit.", "/templates/tpl_21", 5, true],
  ["project-shared", "Yao a commenté Boutique de téléphones Adjamé", "« La photo du comptoir est top. On peut avoir une version pour statut WhatsApp ? »", "/projects/proj_watch", 6, true],
  ["generation-complete", "Shooting produit terminé", "6 photos en décor pour le flyer du marché de Treichville.", "/generations", 6, true],
  ["credits-low", "Crédits rechargés", "1 000 crédits ont été ajoutés à votre compte.", "/credits", 7, true],
  ["campaign-ready", "Nouvel arrivage wax terminée", "Campagne terminée avec 312 messages WhatsApp reçus.", "/campaigns/camp_fitness_drop", 8, true],
  ["export-complete", "Export terminé", "Flyer marché Treichville.pdf est prêt à imprimer.", "/assets", 9, true],
  ["generation-complete", "Variantes de pub prêtes", "Créas A–D pour le carrousel Facebook.", "/generations", 10, true],
  ["new-template", "Nouveau modèle : Carrousel avant/après", "Mises en page axées sur la preuve pour Beauté.", "/templates/tpl_11", 11, true],
  ["project-shared", "Mariam a rejoint votre espace de travail", "Mariam Traoré a accepté l'invitation Admin.", "/workspace", 12, true],
  ["generation-complete", "Rendu vidéo terminé", "Travelling avant sur l'assiette d'attiéké (5 s) est prêt.", "/generations", 13, true],
  ["campaign-ready", "Promo téléphones Adjamé terminée", "Les statistiques finales sont disponibles.", "/campaigns/camp_watch_editorial", 14, true],
  ["export-complete", "Export terminé", "Arrivage téléphones — HD.mp4 est terminé.", "/assets", 15, true],
];

export const notifications: Notification[] = rows.map(([kind, title, body, href, d, read], i) => ({
  id: `notif_${i + 1}`,
  kind, title, body, href, read,
  createdAt: daysAgo(d, 18 - (i % 9)),
}));
