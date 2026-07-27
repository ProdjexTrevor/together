export type ItemType = "task" | "decision" | "goal" | "financial_target";
export type Priority = "low" | "normal" | "high";

export type TaskStatus = "not_started" | "in_progress" | "blocked" | "completed";
export type DecisionStatus =
  | "collecting_options"
  | "awaiting_response"
  | "discussion"
  | "decided";
export type GoalStatus = "not_started" | "on_track" | "needs_attention" | "completed";
export type FinancialStatus = "not_started" | "on_track" | "behind" | "reached";
export type ItemStatus = TaskStatus | DecisionStatus | GoalStatus | FinancialStatus;

export type GoalTrackingType = "numeric" | "percentage" | "milestone" | "habit";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: "creator" | "partner";
  status: "active" | "invited" | "left";
  joined_at: string | null;
  created_at: string;
}

export interface HouseholdInvitation {
  id: string;
  household_id: string;
  email: string;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface Item {
  id: string;
  household_id: string;
  type: ItemType;
  title: string;
  description: string | null;
  status: ItemStatus;
  created_by: string;
  owner_id: string | null;
  priority: Priority;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskChecklistItem {
  id: string;
  item_id: string;
  title: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
}

export interface DecisionOption {
  id: string;
  item_id: string;
  title: string;
  description: string | null;
  pros: string[];
  cons: string[];
  image_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface DecisionResponse {
  id: string;
  item_id: string;
  option_id: string;
  user_id: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalMilestone {
  id: string;
  item_id: string;
  title: string;
  target_date: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface GoalDetails {
  item_id: string;
  tracking_type: GoalTrackingType;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  weekly_frequency: number | null;
  streak_count: number;
}

export interface FinancialDetails {
  item_id: string;
  target_amount_cents: number;
  current_amount_cents: number;
}

export interface FinancialContribution {
  id: string;
  item_id: string;
  amount_cents: number;
  contributor_id: string;
  contributed_at: string;
  note: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  item_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  item_id: string;
  comment_id: string | null;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  household_id: string;
  item_id: string | null;
  actor_id: string;
  event_type: string;
  summary: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  household_id: string;
  item_id: string | null;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  assignments: boolean;
  comments: boolean;
  mentions: boolean;
  decisions: boolean;
  deadlines: boolean;
  contributions: boolean;
}

export interface HouseholdContext {
  household: Household;
  members: (HouseholdMember & { profile: Profile })[];
  currentUser: Profile;
  partner: Profile | null;
}

export interface ItemWithMeta extends Item {
  checklist?: TaskChecklistItem[];
  options?: DecisionOption[];
  responses?: DecisionResponse[];
  milestones?: GoalMilestone[];
  goal?: GoalDetails | null;
  financial?: FinancialDetails | null;
  contributions?: FinancialContribution[];
  comment_count?: number;
  outcome?: string | null;
  decided_option_id?: string | null;
}
