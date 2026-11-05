import type { Creator } from "@/lib/types";
import { CREATOR_LOOKS } from "./creatorLooks";

// [id, name, gender, age, style, languages, country, avatar, bio, featured]
// Ids are kept from the previous seed so existing references stay valid.
type R = [string, string, Creator["gender"], number, string, string[], string, number, string, boolean];

// Portraits and character sheets are generated with Higgsfield and stored in /public/creators/<id>/.
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
  // Added from Sokozia (portrait + sheet; no intro video yet).
  ["creator_coumba", "Coumba", "female", 26, "Mariage & cérémonies", ["Français", "Wolof"], "Sénégal", 0, "Tenues de cérémonie, baptêmes et mariages : élégance et émotion.", false],
  ["creator_nadege", "Nadège", "female", 27, "Sport & fitness", ["Français", "Anglais"], "Cameroun", 0, "Routines sport, compléments et tenues de training, énergie à fond.", false],
  ["creator_binta", "Binta", "female", 25, "Bijoux & accessoires", ["Français", "Peul"], "Guinée", 0, "Bijoux, sacs et accessoires en gros plan, avec beaucoup de style.", false],
  ["creator_ange", "Ange", "female", 23, "Ongles & beauté des mains", ["Français", "Dioula"], "Côte d'Ivoire", 0, "Nail art, soins des mains et unboxings girly, très gros plans.", false],
  ["creator_rokhaya", "Rokhaya", "female", 31, "Maternité & bébé", ["Français", "Wolof"], "Sénégal", 0, "Produits bébé et maman testés à la maison, conseils de grande sœur.", false],
  ["creator_esther", "Esther", "female", 24, "Musique & danse", ["Français", "Lingala"], "RD Congo", 0, "Danse, sons du moment et transitions rythmées, le produit dans le flow.", false],
  ["creator_laetitia", "Laetitia", "female", 29, "Parfums & senteurs", ["Français"], "Gabon", 0, "Parfums, encens et huiles : révélations lentes et ambiance sensuelle.", false],
  ["creator_sali", "Sali", "female", 32, "Déco & intérieur", ["Français", "Mooré"], "Burkina Faso", 0, "Déco, meubles et objets artisanaux mis en scène dans un intérieur chaleureux.", false],
  ["creator_maimouna", "Maïmouna", "female", 28, "Voyage & découverte", ["Français", "Bambara"], "Mali", 0, "Vlogs de voyage, hôtels, transport et bons plans à travers l'Afrique.", false],
  ["creator_princesse", "Princesse", "female", 22, "Sneakers & streetwear", ["Français", "Éwé"], "Togo", 0, "Sneakers, streetwear et looks du jour, ton cool et direct.", false],
  ["creator_serge", "Serge", "male", 33, "Auto & moto", ["Français", "Anglais"], "Cameroun", 0, "Motos, voitures et accessoires testés sur la route, ton franc.", false],
  ["creator_abdoulaye", "Abdoulaye", "male", 28, "Barbier & soins homme", ["Français", "Wolof"], "Sénégal", 0, "Coupes, barbe, tondeuses et soins pour hommes, démos au salon.", false],
  ["creator_kwame", "Kwame", "male", 30, "Mode homme", ["Anglais", "Twi"], "Ghana", 0, "Costumes, chemises et chaussures pour hommes, looks soignés.", false],
  ["creator_ousmane", "Ousmane", "male", 38, "Agriculture & élevage", ["Français", "Peul"], "Guinée", 0, "Semences, engrais, outils et élevage expliqués au champ, sans détour.", false],
  ["creator_patrick", "Patrick", "male", 35, "Électroménager", ["Français", "Dioula"], "Côte d'Ivoire", 0, "Frigos, ventilos, mixeurs : démonstrations claires et conseils d'achat.", false],
  ["creator_junior", "Junior", "male", 24, "Football", ["Français", "Lingala"], "RD Congo", 0, "Maillots, crampons et soirées match entre potes, toute l'ambiance du foot.", false],
  ["creator_idrissa", "Idrissa", "male", 41, "Bricolage & outils", ["Français", "Haoussa"], "Niger", 0, "Outils, quincaillerie et réparations à la maison, gestes précis.", false],
  ["creator_desire", "Désiré", "male", 32, "Finance & Mobile Money", ["Français", "Fon"], "Bénin", 0, "Applis, épargne, assurance et Mobile Money expliqués simplement.", false],
  ["creator_hamidou", "Hamidou", "male", 29, "Street food & grillades", ["Français", "Mooré"], "Burkina Faso", 0, "Brochettes, grillades et maquis : il goûte, il rit, ça donne faim.", false],
  ["creator_thierry", "Thierry", "male", 27, "Solaire & électricité", ["Français", "Éwé"], "Togo", 0, "Panneaux solaires, batteries et installations électriques, tests concrets.", false],
];

/** Creators without an intro clip yet. */
const NO_INTRO = new Set([
  "creator_coumba",
  "creator_nadege",
  "creator_binta",
  "creator_ange",
  "creator_rokhaya",
  "creator_esther",
  "creator_laetitia",
  "creator_sali",
  "creator_maimouna",
  "creator_princesse",
  "creator_serge",
  "creator_abdoulaye",
  "creator_kwame",
  "creator_ousmane",
  "creator_patrick",
  "creator_junior",
  "creator_idrissa",
  "creator_desire",
  "creator_hamidou",
  "creator_thierry",
]);

export const creators: Creator[] = rows.map(([id, name, gender, age, style, languages, country, , bio, featured]) => ({
  id,
  name, gender, age, style, languages, country, bio, featured,
  ageRange: age < 25 ? "18–24" : age < 30 ? "25–29" : age < 35 ? "30–34" : "35+",
  avatarUrl: `/creators/${id}/portrait.jpg`,
  portrait: `/creators/${id}/portrait.jpg`,
  sheet: `/creators/${id}/sheet.jpg`,
  intro: NO_INTRO.has(id) ? undefined : `/creators/${id}/intro.mp4`,
  look: CREATOR_LOOKS[id] ?? "",
}));

/** Absolute URL of a creator's sheet, so Higgsfield can fetch it as a reference image. */
export function creatorSheetUrl(c: Pick<Creator, "sheet">) {
  const app = process.env.NEXT_PUBLIC_APP_URL ?? "";
  // Higgsfield can't reach localhost: in development, use the published copy of the sheet.
  const origin = app.startsWith("https://") ? app : "https://sokozia.vercel.app";
  return new URL(c.sheet, origin).toString();
}
