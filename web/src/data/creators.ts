import type { Creator } from "@/lib/types";
import { avatar } from "@/lib/utils";

// [id, name, gender, age, style, languages, country, avatar, bio, featured]
// Ids are kept from the previous seed so existing references stay valid.
type R = [string, string, Creator["gender"], number, string, string[], string, number, string, boolean];

// Avatars are placeholders; replace with generated African portraits before launch.
const rows: R[] = [
  ["creator_maya", "Aïcha", "female", 24, "Beauté", ["Français", "Dioula"], "Côte d'Ivoire", 47, "Routines karité, soins naturels et conseils peau. Ton chaleureux de grande sœur.", true],
  ["creator_jordan", "Kofi", "male", 29, "Tech & téléphones", ["Français", "Anglais"], "Côte d'Ivoire", 33, "Déballages de téléphones et tests honnêtes, du marché d'Adjamé à la boutique.", true],
  ["creator_sofia", "Fatou", "female", 27, "Mode wax", ["Français", "Wolof"], "Sénégal", 45, "Tenues wax, essayages et transitions pour cérémonies et bureau.", true],
  ["creator_marcus", "Moussa", "male", 31, "Marché & bons plans", ["Français", "Bambara"], "Mali", 59, "Comparaisons de prix et bons plans du marché, avec beaucoup d'humour.", true],
  ["creator_priya", "Nneka", "female", 26, "Coiffure", ["Anglais", "Pidgin"], "Nigeria", 41, "Tresses, perruques et soins des cheveux crépus. Démos pas à pas.", false],
  ["creator_leo", "Chinedu", "male", 23, "Humour", ["Anglais", "Pidgin"], "Nigeria", 15, "Sketchs courts où le produit arrive au bon moment. Ça fait vraiment rire.", false],
  ["creator_hana", "Mariam", "female", 30, "Cuisine", ["Français", "Bambara"], "Mali", 44, "Recettes du quotidien vues du dessus, voix posée et astuces de maman.", false],
  ["creator_diego", "Yao", "male", 34, "Livraison & quartier", ["Français", "Dioula"], "Côte d'Ivoire", 60, "Vidéos en extérieur dans les rues d'Abidjan, produits en situation réelle.", false],
  ["creator_amara", "Grâce", "female", 28, "Bien-être", ["Français", "Lingala"], "RD Congo", 49, "Explications simples sur les ingrédients naturels et les bonnes habitudes.", false],
  ["creator_ethan", "Émeka", "male", 25, "Gaming & tech", ["Anglais", "Pidgin"], "Nigeria", 52, "Tests d'accessoires, montages rythmés et avis sans détour.", false],
  ["creator_chloe", "Khady", "female", 22, "Vie étudiante", ["Français", "Wolof"], "Sénégal", 16, "Angle petit budget et vie de campus à Dakar, très authentique.", false],
  ["creator_noah", "Ibrahima", "male", 36, "Vie de famille", ["Français", "Wolof"], "Sénégal", 68, "Démos pratiques à la maison avec les enfants, une touche d'humour.", false],
  ["creator_yuki", "Adjoa", "female", 27, "Art & design", ["Français", "Anglais"], "Côte d'Ivoire", 25, "Mises en scène produit colorées, pagnes et boucles en stop-motion.", false],
  ["creator_isabella", "Tshiala", "female", 33, "Maison", ["Français", "Lingala"], "RD Congo", 20, "Produits mis en scène dans la cuisine et la salle de bain, ton rassurant.", false],
  ["creator_samuel", "Amina", "female", 40, "Commerce & business", ["Français", "Anglais"], "Cameroun", 53, "Conseils aux commerçantes et avis francs sur le rapport qualité-prix.", false],
  ["creator_zara", "Wanjiru", "female", 29, "Luxe & élégance", ["Anglais", "Swahili"], "Kenya", 32, "Finition éditoriale, révélations lentes et cadrages élégants.", false],
];

export const creators: Creator[] = rows.map(([id, name, gender, age, style, languages, country, av, bio, featured], i) => ({
  id,
  name, gender, age, style, languages, country, bio, featured,
  ageRange: age < 25 ? "18–24" : age < 30 ? "25–29" : age < 35 ? "30–34" : "35+",
  avatarUrl: avatar(av + (i % 2)),
}));
