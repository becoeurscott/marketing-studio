import type { Workspace } from "@/lib/types";
import { avatar, daysAgo } from "@/lib/utils";

export const workspace: Workspace = {
  id: "ws_main",
  name: "Sokozia",
  members: [
    { id: "user_alex", name: "Alex Carter", email: "alex@northstarcreative.co", role: "owner", avatarUrl: avatar(12), status: "active", joinedAt: daysAgo(210) },
    { id: "user_sarah", name: "Sarah Kim", email: "sarah@northstarcreative.co", role: "admin", avatarUrl: avatar(47), status: "active", joinedAt: daysAgo(150) },
    { id: "user_michael", name: "Michael Reyes", email: "michael@northstarcreative.co", role: "editor", avatarUrl: avatar(33), status: "active", joinedAt: daysAgo(90) },
    { id: "user_jamie", name: "Jamie Lin", email: "jamie@freelance.example", role: "viewer", avatarUrl: avatar(20), status: "invited", joinedAt: daysAgo(2) },
  ],
};
