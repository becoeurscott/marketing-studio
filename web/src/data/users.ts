import type { User } from "@/lib/types";

/** New account: filled in from Settings / Profile. */
export const currentUser: User = {
  id: "user_me",
  name: "Mon compte",
  email: "",
  company: "",
  role: "",
  avatarUrl: "",
  createdAt: new Date(0).toISOString(),
};
