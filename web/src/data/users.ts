import type { User } from "@/lib/types";
import { avatar, daysAgo } from "@/lib/utils";

export const currentUser: User = {
  id: "user_alex",
  name: "Alex Carter",
  email: "alex@northstarcreative.co",
  company: "Northstar Creative",
  role: "Founder",
  avatarUrl: avatar(12),
  createdAt: daysAgo(210),
};
