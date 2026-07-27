export type YnmVote = "yes" | "no" | "maybe" | "unset";

export type BasecampYnmItem = {
  id: string;
  household_id: string;
  title: string;
  category: string;
  notes: string | null;
  vote_a: YnmVote;
  vote_b: YnmVote;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type BasecampCoupon = {
  id: string;
  household_id: string;
  title: string;
  body: string;
  from_user_id: string;
  to_user_id: string | null;
  status: "available" | "redeemed" | "expired";
  redeemed_at: string | null;
  created_at: string;
};

export type BasecampMission = {
  id: string;
  household_id: string;
  title: string;
  details: string | null;
  reward: string;
  assigned_to: string | null;
  status: "open" | "done" | "claimed";
  created_by: string;
  completed_at: string | null;
  created_at: string;
};

export type BasecampGoal = {
  id: string;
  household_id: string;
  title: string;
  details: string | null;
  target: number;
  progress: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type BasecampNote = {
  id: string;
  household_id: string;
  author_id: string;
  body: string;
  heat: number;
  created_at: string;
};
