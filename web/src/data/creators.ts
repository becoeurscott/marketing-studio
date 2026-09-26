import type { Creator } from "@/lib/types";
import { avatar } from "@/lib/utils";

type R = [string, Creator["gender"], number, string, string[], number, string, boolean];
const rows: R[] = [
  ["Maya", "female", 24, "Lifestyle", ["Anglais", "Espagnol"], 47, "Routines matinales, soin de la peau et slow living. Ton chaleureux et naturel.", true],
  ["Jordan", "male", 29, "Fitness", ["Anglais"], 33, "Énergie de salle de sport, tests produits honnêtes, avis sans détour.", true],
  ["Sofia", "female", 27, "Beauté", ["Anglais", "Portugais"], 45, "Spécialiste du GRWM. Démos d'application précises et gros plans.", true],
  ["Marcus", "male", 31, "Tech", ["Anglais", "Allemand"], 59, "Déballages et analyses techniques avec un humour pince-sans-rire.", true],
  ["Priya", "female", 26, "Mode", ["Anglais", "Hindi"], 41, "Transitions de tenues et fit checks street style.", false],
  ["Leo", "male", 23, "Humour", ["Anglais"], 15, "Placements produit en sketchs qui font vraiment mouche.", false],
  ["Hana", "female", 30, "Cuisine", ["Anglais", "Japonais"], 44, "Plans de cuisine vus du dessus et voix off apaisantes.", false],
  ["Diego", "male", 34, "Voyage", ["Espagnol", "Anglais"], 60, "Plans de coupe en extérieur et produits en situation réelle.", false],
  ["Amara", "female", 28, "Bien-être", ["Anglais", "Français"], 49, "Explications posées et scientifiques des ingrédients.", false],
  ["Ethan", "male", 25, "Gaming", ["Anglais"], 52, "Tests de setups de bureau et montages rythmés.", false],
  ["Chloe", "female", 22, "Vie étudiante", ["Anglais"], 16, "Authenticité de chambre d'étudiant, angle petit budget.", false],
  ["Noah", "male", 36, "Vie de papa", ["Anglais"], 68, "Démos pratiques en famille avec une touche d'humour.", false],
  ["Yuki", "non-binary", 27, "Art & design", ["Anglais", "Japonais"], 25, "Flatlays esthétiques et boucles produit en stop-motion.", false],
  ["Isabella", "female", 33, "Maison", ["Anglais", "Italien"], 20, "Mise en scène de produits en cuisine et salle de bain.", false],
  ["Samuel", "male", 40, "Finance", ["Anglais"], 53, "Analyses franches du rapport qualité-prix des produits premium.", false],
  ["Zara", "female", 29, "Luxe", ["Anglais", "Arabe"], 32, "Finition éditoriale, révélations lentes et cadrages élégants.", false],
];

export const creators: Creator[] = rows.map(([name, gender, age, style, languages, av, bio, featured], i) => ({
  id: `creator_${name.toLowerCase()}`,
  name, gender, age, style, languages, bio, featured,
  ageRange: age < 25 ? "18–24" : age < 30 ? "25–29" : age < 35 ? "30–34" : "35+",
  avatarUrl: avatar(av + (i % 2)),
}));
