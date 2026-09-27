import type { Workspace } from "@/lib/types";
import { avatar, daysAgo } from "@/lib/utils";

export const workspace: Workspace = {
  id: "ws_main",
  name: "Sokozia",
  members: [
    { id: "user_alex", name: "Awa Koné", email: "awa@karitedor.example", role: "owner", avatarUrl: avatar(12), status: "active", joinedAt: daysAgo(210) },
    { id: "user_sarah", name: "Mariam Traoré", email: "mariam@karitedor.example", role: "admin", avatarUrl: avatar(47), status: "active", joinedAt: daysAgo(150) },
    { id: "user_michael", name: "Yao Kouassi", email: "yao@karitedor.example", role: "editor", avatarUrl: avatar(33), status: "active", joinedAt: daysAgo(90) },
    { id: "user_jamie", name: "Fatou Diop", email: "fatou@freelance.example", role: "viewer", avatarUrl: avatar(20), status: "invited", joinedAt: daysAgo(2) },
  ],
};
