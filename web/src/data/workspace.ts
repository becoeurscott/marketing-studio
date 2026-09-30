import type { Workspace } from "@/lib/types";

export const workspace: Workspace = {
  id: "ws_main",
  name: "Sokozia",
  members: [
    { id: "user_me", name: "Mon compte", email: "", role: "owner", avatarUrl: "", status: "active", joinedAt: new Date(0).toISOString() },
  ],
};
