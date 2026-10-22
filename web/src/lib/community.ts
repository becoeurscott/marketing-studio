export interface CommunityPost {
  id: string;
  kind: "image" | "video" | "ugc";
  url: string;
  poster: string | null;
  prompt: string;
  modelLabel: string;
  ratio: string;
  author: string;
  mine: boolean;
  createdAt: string;
}
