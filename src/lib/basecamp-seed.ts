import type {
  BasecampCoupon,
  BasecampGoal,
  BasecampMission,
  BasecampNote,
  BasecampYnmItem,
} from "@/types/basecamp";

/** Starter Yes/No/Maybe prompts — expand anytime in the app. */
export const BASECAMP_YNM_SEED: Omit<
  BasecampYnmItem,
  "id" | "household_id" | "created_by" | "created_at" | "updated_at" | "vote_a" | "vote_b"
>[] = [
  { title: "Morning quickie before work", category: "Timing", notes: null },
  { title: "Sex with the lights on", category: "Setting", notes: null },
  { title: "Blindfold me", category: "Sensation", notes: null },
  { title: "Blindfold you", category: "Sensation", notes: null },
  { title: "Spanking (giving)", category: "Play", notes: null },
  { title: "Spanking (receiving)", category: "Play", notes: null },
  { title: "Dirty talk out loud", category: "Talk", notes: null },
  { title: "Text me filthy things during the day", category: "Talk", notes: null },
  { title: "Oral (giving)", category: "Acts", notes: null },
  { title: "Oral (receiving)", category: "Acts", notes: null },
  { title: "Sixty-nine", category: "Acts", notes: null },
  { title: "From behind", category: "Positions", notes: null },
  { title: "You on top, slow and deep", category: "Positions", notes: null },
  { title: "Against the wall / standing", category: "Positions", notes: null },
  { title: "Shower or bath sex", category: "Setting", notes: null },
  { title: "Public risk (car, nowhere we'll get caught… much)", category: "Risk", notes: null },
  { title: "Toys on me", category: "Toys", notes: null },
  { title: "Toys on you", category: "Toys", notes: null },
  { title: "Remote toy while we're out", category: "Toys", notes: null },
  { title: "Roleplay (tell me the scene)", category: "Fantasy", notes: null },
  { title: "Dominant for a night", category: "Power", notes: null },
  { title: "Submissive for a night", category: "Power", notes: null },
  { title: "Edging / denied orgasm", category: "Play", notes: null },
  { title: "Multiple rounds in one night", category: "Stamina", notes: null },
  { title: "Wake me up with your mouth", category: "Timing", notes: null },
  { title: "Record audio (private, for us only)", category: "Media", notes: null },
  { title: "Send nudes on request", category: "Media", notes: null },
  { title: "Lingerie night — dress up for me", category: "Aesthetic", notes: null },
  { title: "Massage that turns filthy", category: "Warmup", notes: null },
  { title: "Anal play (talk limits first)", category: "Acts", notes: null },
];

export const BASECAMP_COUPON_SEED: Omit<
  BasecampCoupon,
  "id" | "household_id" | "from_user_id" | "to_user_id" | "status" | "redeemed_at" | "created_at"
>[] = [
  {
    title: "One free orgasm — my mouth, your rules",
    body: "Redeem anytime. No rushing. You finish first.",
  },
  {
    title: "Striptease + lap dance",
    body: "Lights low. Music optional. Hands allowed when I say.",
  },
  {
    title: "Breakfast in bed… then dessert",
    body: "I'll feed you, then I'll eat you.",
  },
  {
    title: "You pick the position — three rounds",
    body: "I stay hard for the mission. Hydration encouraged.",
  },
  {
    title: "Filthy voice note on demand",
    body: "Ask and I'll send something that ruins your focus.",
  },
];

export const BASECAMP_MISSION_SEED: Omit<
  BasecampMission,
  | "id"
  | "household_id"
  | "assigned_to"
  | "status"
  | "created_by"
  | "completed_at"
  | "created_at"
>[] = [
  {
    title: "Send me a photo I'll hide in my camera roll",
    details: "Something only we would understand. Caption it dirty.",
    reward: "I'll reply with exactly what I want to do to you tonight.",
  },
  {
    title: "Edge yourself for 10 minutes — no finish",
    details: "Video call optional. Tell me when you're shaking.",
    reward: "I finish you the way you beg for.",
  },
  {
    title: "Wear nothing under your clothes for a date night",
    details: "Tell me when you leave the house.",
    reward: "I get handsy the second we're alone.",
  },
];
