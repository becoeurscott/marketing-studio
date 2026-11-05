/** Curated trending videos on the home page; clicking one opens Studio with its prompt to recreate it. */
export interface TrendingVideo {
  id: string;
  url: string;
  poster: string;
  title: string;
  prompt: string;
}

export const TRENDING_VIDEOS: TrendingVideo[] = [
  {
    id: "trend-1",
    url: "/trending/trend-1.mp4",
    poster: "/trending/trend-1.jpg",
    title: "Bar noir et blanc",
    prompt: "Black and white cinematic close-up of a charming man in a striped shirt and dark waistcoat sitting at a bar table, smiling and pointing at the camera, beer bottles on the table, soft film grain, shallow depth of field",
  },
  {
    id: "trend-2",
    url: "/trending/trend-2.mp4",
    poster: "/trending/trend-2.jpg",
    title: "Freestyle au stade",
    prompt: "A young man in glasses, black t-shirt and jeans does football freestyle tricks on the pitch of a packed stadium at night, a player tries to tackle him, crowd cheering, stadium lights, handheld vertical sports footage",
  },
  {
    id: "trend-3",
    url: "/trending/trend-3.mp4",
    poster: "/trending/trend-3.jpg",
    title: "Night drive",
    prompt: "A stylish woman with long black hair and a cream knit top flips her hair while driving a luxury car at night, purple ambient interior lighting, city lights through the windshield, vertical lifestyle video",
  },
  {
    id: "trend-4",
    url: "/trending/trend-4.mp4",
    poster: "/trending/trend-4.jpg",
    title: "Liasses de billets",
    prompt: "Low-angle vertical shot of a young man in sunglasses and a black hoodie fanning thick stacks of banknotes toward the camera in a bedroom, ceiling fan above, playful flex energy, smartphone style",
  },
  {
    id: "trend-5",
    url: "/trending/trend-5.mp4",
    poster: "/trending/trend-5.jpg",
    title: "Voiture miniature",
    prompt: "A detailed grey sports car miniature sits on a train window ledge, green countryside rushing past outside, the toy car seems to drive alongside the landscape, macro shot, natural daylight, shallow depth of field",
  },
  {
    id: "trend-6",
    url: "/trending/trend-6.mp4",
    poster: "/trending/trend-6.jpg",
    title: "Agents en costume",
    prompt: "Two men in black suits, white shirts and dark sunglasses dance with exaggerated expressions in front of a wooden fence with ivy, the front one shouts and grips his head toward the camera, funny viral vertical video",
  },
];
