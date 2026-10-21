import type { Show, User, Vouch } from "./types";

const day = 24 * 60 * 60 * 1000;
const ago = (days: number, hours = 0) =>
  new Date(Date.now() - days * day - hours * 3600_000).toISOString();

export const ME_ID = "u_me";
export const ME_EMAIL = "chandan@email.com";

export const users: User[] = [
  { id: ME_ID, handle: "chandan", name: "Chandan", tags: ["slow-burn", "cosy-weird", "hidden-gem", "rewatch", "fantasy", "cry-trip"] },
  { id: "u_maya", handle: "maya", name: "Maya Rao", tags: ["slow-burn", "cosy-weird"] },
  { id: "u_dev", handle: "dev", name: "Dev Patel", tags: ["hidden-gem", "fantasy"] },
  { id: "u_sam", handle: "sam", name: "Sam Okafor", tags: ["cry-trip", "rewatch"] },
  { id: "u_arjun", handle: "arjun", name: "Arjun Mehta", tags: ["slow-burn", "rewatch", "fantasy"] },
  { id: "u_noor", handle: "noor", name: "Noor Haddad", tags: ["cosy-weird", "cry-trip"] },
  { id: "u_priya", handle: "priya", name: "Priya Nair", tags: ["slow-burn", "cosy-weird", "hidden-gem", "cry-trip", "rewatch", "fantasy"] },
  { id: "u_lena", handle: "lena", name: "Lena Fischer", tags: ["slow-burn", "hidden-gem"] },
];

/** Undirected friendships between user ids. */
export const friendships: [string, string][] = [
  [ME_ID, "u_maya"],
  [ME_ID, "u_dev"],
  [ME_ID, "u_sam"],
  ["u_maya", "u_noor"],
  ["u_dev", "u_arjun"],
  ["u_dev", "u_priya"],
  ["u_sam", "u_lena"],
];

export const shows: Show[] = [
  { id: "s_frieren", title: "Frieren: Beyond Journey's End", kind: "anime", year: 2023, credit: "Madhouse" },
  { id: "s_dandadan", title: "Dandadan", kind: "anime", year: 2024, credit: "Science SARU" },
  { id: "s_dandadan3", title: "Dandadan Season 3", kind: "anime", year: 2026, credit: "Science SARU", releaseLabel: "Nov 14" },
  { id: "s_bocchi", title: "Bocchi the Rock!", kind: "anime", year: 2022, credit: "CloverWorks" },
  { id: "s_apothecary", title: "The Apothecary Diaries", kind: "anime", year: 2023, credit: "OLM" },
  { id: "s_bebop", title: "Cowboy Bebop", kind: "anime", year: 1998, credit: "Sunrise" },
  { id: "s_mushishi", title: "Mushishi", kind: "anime", year: 2005, credit: "Artland" },
  { id: "s_dungeon", title: "Delicious in Dungeon", kind: "anime", year: 2024, credit: "Trigger" },
  { id: "s_severance", title: "Severance", kind: "tv", year: 2022, credit: "Dan Erickson" },
  { id: "s_bear", title: "The Bear", kind: "tv", year: 2022, credit: "Christopher Storer" },
  { id: "s_shogun", title: "Shōgun", kind: "tv", year: 2024, credit: "Rachel Kondo" },
  { id: "s_fleabag", title: "Fleabag", kind: "tv", year: 2016, credit: "Phoebe Waller-Bridge" },
  { id: "s_slowhorses", title: "Slow Horses", kind: "tv", year: 2022, credit: "Will Smith" },
  { id: "s_slowhorses6", title: "Slow Horses Season 6", kind: "tv", year: 2026, credit: "Will Smith", releaseLabel: "Dec 18" },
  { id: "s_adolescence", title: "Adolescence", kind: "tv", year: 2025, credit: "Jack Thorne" },
  { id: "s_succession", title: "Succession", kind: "tv", year: 2018, credit: "Jesse Armstrong" },
  { id: "s_reservation", title: "Reservation Dogs", kind: "tv", year: 2021, credit: "Sterlin Harjo" },
];

export const vouches: Vouch[] = [
  { id: "v1", authorId: "u_maya", showId: "s_frieren", rating: 9, review: "Quiet, funny, and somehow the saddest show about being kind. Start with episode 1 and let it sneak up on you.", tags: ["slow-burn", "found-family"], createdAt: ago(2) },
  { id: "v2", authorId: "u_dev", showId: "s_frieren", rating: 8, review: "Gorgeous and a bit too still for me at first, then the last ten minutes hit. Bring tissues.", tags: ["slow-burn", "cry-trip"], createdAt: ago(7) },
  { id: "v3", authorId: "u_arjun", showId: "s_frieren", rating: 10, review: "Watched it twice in one week. The bar scene alone is worth it.", tags: ["rewatch", "found-family"], createdAt: ago(3) },
  { id: "v4", authorId: "u_noor", showId: "s_frieren", rating: 7, review: "Lovely, but I wanted more of the childhood section.", tags: ["slow-burn", "drama"], createdAt: ago(6) },
  { id: "v5", authorId: "u_dev", showId: "s_severance", rating: 10, review: "Office horror that is really about grief. Do not read anything about it first.", tags: ["mind-bending", "slow-burn"], createdAt: ago(2, 5) },
  { id: "v6", authorId: "u_sam", showId: "s_severance", rating: 9, review: "The best production design on television. The elevator scenes are unreal.", tags: ["mind-bending", "hidden-gem"], createdAt: ago(9) },
  { id: "v7", authorId: "u_priya", showId: "s_severance", rating: 8, review: "Brilliant for six episodes, then it started over-explaining itself.", tags: ["mind-bending", "drama"], createdAt: ago(5) },
  { id: "v8", authorId: "u_maya", showId: "s_bear", rating: 8, review: "Loud kitchen, tender centre. Season two is the one.", tags: ["feel-good", "intense"], createdAt: ago(4) },
  { id: "v9", authorId: "u_sam", showId: "s_shogun", rating: 9, review: "Slow, deliberate, and every scene is a chess move. Worth the patience.", tags: ["slow-burn", "epic"], createdAt: ago(3, 6) },
  { id: "v10", authorId: "u_noor", showId: "s_shogun", rating: 10, review: "I have already told everyone I know to watch it.", tags: ["epic", "rewatch"], createdAt: ago(8) },
  { id: "v11", authorId: "u_dev", showId: "s_dandadan", rating: 9, review: "Absolute chaos with a huge heart. The first episode is the whole pitch.", tags: ["chaotic", "romance"], createdAt: ago(5, 3) },
  { id: "v12", authorId: "u_maya", showId: "s_bocchi", rating: 10, review: "Painfully relatable and the funniest thing I watched all year.", tags: ["feel-good", "short"], createdAt: ago(6, 2) },
  { id: "v13", authorId: "u_sam", showId: "s_bebop", rating: 10, review: "Still the coolest thing ever made. Watch it for the music, stay for the ending.", tags: ["classic", "cry-trip"], createdAt: ago(12) },
  { id: "v14", authorId: "u_lena", showId: "s_fleabag", rating: 9, review: "Two seasons, zero wasted minutes.", tags: ["short", "dark-comedy"], createdAt: ago(11) },
  { id: "v15", authorId: "u_maya", showId: "s_fleabag", rating: 10, review: "Season two broke me in the best way. Do not skip the priest.", tags: ["dark-comedy", "rewatch"], createdAt: ago(14) },
  { id: "v16", authorId: "u_arjun", showId: "s_slowhorses", rating: 9, review: "Spies who are bad at their jobs and brilliant at survival.", tags: ["feel-good", "hidden-gem"], createdAt: ago(10) },
  { id: "v17", authorId: "u_dev", showId: "s_slowhorses", rating: 8, review: "Gary Oldman as a deeply unpleasant genius. Perfect.", tags: ["hidden-gem", "dark-comedy"], createdAt: ago(13) },
  { id: "v18", authorId: "u_priya", showId: "s_apothecary", rating: 9, review: "A cosy mystery wearing a palace intrigue costume.", tags: ["cosy-weird", "mystery"], createdAt: ago(8, 4) },
  { id: "v19", authorId: "u_sam", showId: "s_dungeon", rating: 8, review: "Cooking show, dungeon crawl, and genuinely funny. Now I am hungry.", tags: ["cosy-weird", "feel-good"], createdAt: ago(15) },
  { id: "v20", authorId: "u_dev", showId: "s_adolescence", rating: 9, review: "Four episodes, four single takes, and it stays with you for days.", tags: ["intense", "short"], createdAt: ago(1, 10) },
  { id: "v21", authorId: "u_maya", showId: "s_adolescence", rating: 8, review: "Hard to watch and impossible to look away from.", tags: ["intense", "short"], createdAt: ago(1, 2) },
  { id: "v22", authorId: ME_ID, showId: "s_severance", rating: 9, review: "Slow, strange, and then it gets you. Watch it with someone you can talk to after.", tags: ["slow-burn", "mind-bending"], createdAt: ago(2, 1) },
  { id: "v23", authorId: ME_ID, showId: "s_bebop", rating: 10, review: "See you, space cowboy. Perfect, tragic, and gloriously cool.", tags: ["classic", "cry-trip"], createdAt: ago(20) },
  { id: "v24", authorId: ME_ID, showId: "s_bear", rating: 8, review: "Stressful in the way good kitchens are. Yes, chef.", tags: ["intense", "feel-good"], createdAt: ago(25) },
  { id: "v25", authorId: ME_ID, showId: "s_mushishi", rating: 9, review: "Quiet, strange episodes about people and the invisible things around them.", tags: ["cosy-weird", "slow-burn"], createdAt: ago(30) },
  { id: "v26", authorId: ME_ID, showId: "s_fleabag", rating: 9, review: "Sharp, filthy and secretly tender.", tags: ["dark-comedy", "rewatch"], createdAt: ago(40) },
];

export interface AnticipationRecord {
  id: string;
  showId: string;
  createdAt: string;
  waiting: { userId: string; linkedVouchId: string }[];
}

export const anticipations: AnticipationRecord[] = [
  {
    id: "a1",
    showId: "s_dandadan3",
    createdAt: ago(1),
    waiting: [
      { userId: "u_maya", linkedVouchId: "v12" },
      { userId: "u_dev", linkedVouchId: "v11" },
      { userId: "u_sam", linkedVouchId: "v13" },
    ],
  },
  {
    id: "a2",
    showId: "s_slowhorses6",
    createdAt: ago(4),
    waiting: [
      { userId: "u_dev", linkedVouchId: "v17" },
      { userId: "u_sam", linkedVouchId: "v9" },
    ],
  },
];

/** Eligibility records as the backend would hold them, keyed by target user. */
export const eligibility: Record<string, { nominated: boolean; condition: string }> = {
  u_priya: { nominated: true, condition: "shared_taste" },
  u_noor: { nominated: true, condition: "mutual_anticipation" },
  u_arjun: { nominated: true, condition: "shared_taste" },
  u_lena: { nominated: false, condition: "shared_taste" },
};

export const initialRequests = [
  { id: "r1", fromId: "u_priya", toId: ME_ID, createdAt: ago(1) },
  { id: "r2", fromId: "u_noor", toId: ME_ID, createdAt: ago(2) },
];
