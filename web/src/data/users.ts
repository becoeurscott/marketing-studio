import type { User } from "@/lib/types";
import { avatar, daysAgo } from "@/lib/utils";

export const currentUser: User = {
  id: "user_alex",
  name: "Awa Koné",
  email: "awa@karitedor.example",
  company: "Karité d'Or",
  role: "Fondatrice",
  avatarUrl: avatar(12),
  createdAt: daysAgo(210),
};
