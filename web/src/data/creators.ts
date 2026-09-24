import type { Creator } from "@/lib/types";
import { avatar } from "@/lib/utils";

type R = [string, Creator["gender"], number, string, string[], number, string, boolean];
const rows: R[] = [
  ["Maya", "female", 24, "Lifestyle", ["English", "Spanish"], 47, "Morning routines, skincare and slow living. Warm, unpolished delivery.", true],
  ["Jordan", "male", 29, "Fitness", ["English"], 33, "Gym floor energy, honest product tests, no-nonsense takes.", true],
  ["Sofia", "female", 27, "Beauty", ["English", "Portuguese"], 45, "GRWM specialist. Precise application demos and close-ups.", true],
  ["Marcus", "male", 31, "Tech", ["English", "German"], 59, "Unboxings and spec breakdowns with a dry sense of humor.", true],
  ["Priya", "female", 26, "Fashion", ["English", "Hindi"], 41, "Outfit transitions and street style fit checks.", false],
  ["Leo", "male", 23, "Comedy", ["English"], 15, "Skit-driven product placements that actually land.", false],
  ["Hana", "female", 30, "Food", ["English", "Japanese"], 44, "Overhead cooking shots and calm voiceovers.", false],
  ["Diego", "male", 34, "Travel", ["Spanish", "English"], 60, "On-location b-roll and product-in-the-wild moments.", false],
  ["Amara", "female", 28, "Wellness", ["English", "French"], 49, "Grounded, science-forward explanations of ingredients.", false],
  ["Ethan", "male", 25, "Gaming", ["English"], 52, "Desk-setup reviews and fast-cut edits.", false],
  ["Chloe", "female", 22, "Student life", ["English"], 16, "Dorm-room authenticity, budget-friendly angle.", false],
  ["Noah", "male", 36, "Dad life", ["English"], 68, "Practical family-use demos with quick humor.", false],
  ["Yuki", "non-binary", 27, "Art & design", ["English", "Japanese"], 25, "Aesthetic flatlays and stop-motion product loops.", false],
  ["Isabella", "female", 33, "Home", ["English", "Italian"], 20, "Kitchen and bathroom shelf styling with products.", false],
  ["Samuel", "male", 40, "Finance", ["English"], 53, "Straight-talking value breakdowns for premium products.", false],
  ["Zara", "female", 29, "Luxury", ["English", "Arabic"], 32, "Editorial polish, slow reveals and elegant framing.", false],
];

export const creators: Creator[] = rows.map(([name, gender, age, style, languages, av, bio, featured], i) => ({
  id: `creator_${name.toLowerCase()}`,
  name, gender, age, style, languages, bio, featured,
  ageRange: age < 25 ? "18–24" : age < 30 ? "25–29" : age < 35 ? "30–34" : "35+",
  avatarUrl: avatar(av + (i % 2)),
}));
