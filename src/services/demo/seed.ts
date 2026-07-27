import type {
  ActivityEvent,
  Comment,
  CommentReaction,
  DecisionOption,
  DecisionResponse,
  FinancialContribution,
  FinancialDetails,
  GoalDetails,
  GoalMilestone,
  Household,
  HouseholdInvitation,
  HouseholdMember,
  Item,
  Notification,
  NotificationPreferences,
  Profile,
  TaskChecklistItem,
  WellnessCheckIn,
  WebAuthnCredential,
} from "@/types";

export const DEMO_PASSWORD = "together123";

export const IDS = {
  trevor: "user-trevor",
  chanda: "user-chanda",
  household: "hh-trevor-chanda",
  taskGrocery: "item-task-grocery",
  taskDentist: "item-task-dentist",
  taskElectric: "item-task-electric",
  taskMemorial: "item-task-memorial",
  decisionVacation: "item-decision-vacation",
  goalDateNight: "item-goal-date-night",
  financeEmergency: "item-finance-emergency",
  optLake: "opt-lake",
  optBeach: "opt-beach",
  optStay: "opt-stay",
};

const now = new Date("2025-05-16T15:00:00.000Z");

function iso(daysFromNow: number, hour = 12): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function createSeedState() {
  const profiles: Profile[] = [
    {
      id: IDS.trevor,
      email: "trevor@together.app",
      full_name: "Trevor",
      avatar_url: null,
      timezone: "America/Chicago",
      created_at: iso(-90),
      updated_at: iso(-1),
    },
    {
      id: IDS.chanda,
      email: "chanda@together.app",
      full_name: "Chanda",
      avatar_url: null,
      timezone: "America/Chicago",
      created_at: iso(-90),
      updated_at: iso(-1),
    },
  ];

  const households: Household[] = [
    {
      id: IDS.household,
      name: "Trevor & Chanda",
      created_by: IDS.trevor,
      created_at: iso(-80),
      updated_at: iso(-1),
    },
  ];

  const members: HouseholdMember[] = [
    {
      id: "mem-1",
      household_id: IDS.household,
      user_id: IDS.trevor,
      role: "creator",
      status: "active",
      joined_at: iso(-80),
      created_at: iso(-80),
    },
    {
      id: "mem-2",
      household_id: IDS.household,
      user_id: IDS.chanda,
      role: "partner",
      status: "active",
      joined_at: iso(-79),
      created_at: iso(-79),
    },
  ];

  const invitations: HouseholdInvitation[] = [];

  const items: Item[] = [
    {
      id: IDS.taskGrocery,
      household_id: IDS.household,
      type: "task",
      title: "Grocery shop for the week",
      description: "Stock up on produce, snacks, and dinner staples.",
      status: "not_started",
      created_by: IDS.trevor,
      owner_id: IDS.chanda,
      priority: "normal",
      start_date: null,
      due_date: iso(1),
      completed_at: null,
      archived_at: null,
      created_at: iso(-3),
      updated_at: iso(-1),
    },
    {
      id: IDS.taskDentist,
      household_id: IDS.household,
      type: "task",
      title: "Book dentist appointments",
      description: "Schedule cleanings for both of us.",
      status: "in_progress",
      created_by: IDS.chanda,
      owner_id: IDS.trevor,
      priority: "high",
      start_date: iso(-2),
      due_date: iso(2),
      completed_at: null,
      archived_at: null,
      created_at: iso(-5),
      updated_at: iso(-1),
    },
    {
      id: IDS.taskElectric,
      household_id: IDS.household,
      type: "task",
      title: "Pay electric bill",
      description: null,
      status: "completed",
      created_by: IDS.trevor,
      owner_id: IDS.trevor,
      priority: "normal",
      start_date: null,
      due_date: iso(-2),
      completed_at: iso(-1),
      archived_at: null,
      created_at: iso(-10),
      updated_at: iso(-1),
    },
    {
      id: IDS.taskMemorial,
      household_id: IDS.household,
      type: "task",
      title: "Plan Memorial Day weekend",
      description: "Food, guests, and outdoor setup.",
      status: "not_started",
      created_by: IDS.chanda,
      owner_id: null,
      priority: "normal",
      start_date: null,
      due_date: iso(4),
      completed_at: null,
      archived_at: null,
      created_at: iso(-4),
      updated_at: iso(-1),
    },
    {
      id: IDS.decisionVacation,
      household_id: IDS.household,
      type: "decision",
      title: "Summer vacation location",
      description:
        "Where should we go for our summer vacation this year? Let's choose a place we'll both love and can get excited about.",
      status: "awaiting_response",
      created_by: IDS.trevor,
      owner_id: null,
      priority: "high",
      start_date: null,
      due_date: iso(14),
      completed_at: null,
      archived_at: null,
      created_at: iso(-10),
      updated_at: iso(-1),
    },
    {
      id: IDS.goalDateNight,
      household_id: IDS.household,
      type: "goal",
      title: "Weekly date night",
      description: "Protect one evening a week just for us.",
      status: "on_track",
      created_by: IDS.chanda,
      owner_id: null,
      priority: "normal",
      start_date: iso(-49),
      due_date: iso(35),
      completed_at: null,
      archived_at: null,
      created_at: iso(-49),
      updated_at: iso(-1),
    },
    {
      id: IDS.financeEmergency,
      household_id: IDS.household,
      type: "financial_target",
      title: "Emergency fund",
      description: "Peace of mind for life's unexpected moments.",
      status: "on_track",
      created_by: IDS.trevor,
      owner_id: null,
      priority: "high",
      start_date: iso(-120),
      due_date: "2025-12-31T00:00:00.000Z",
      completed_at: null,
      archived_at: null,
      created_at: iso(-120),
      updated_at: iso(-1),
    },
  ];

  const checklist: TaskChecklistItem[] = [
    {
      id: "cl-1",
      item_id: IDS.taskGrocery,
      title: "Make list together",
      completed: true,
      sort_order: 0,
      created_at: iso(-2),
    },
    {
      id: "cl-2",
      item_id: IDS.taskGrocery,
      title: "Shop Saturday morning",
      completed: false,
      sort_order: 1,
      created_at: iso(-2),
    },
  ];

  const options: DecisionOption[] = [
    {
      id: IDS.optLake,
      item_id: IDS.decisionVacation,
      title: "Lake cabin",
      description: null,
      pros: ["Peaceful", "Scenery", "Unplugging"],
      cons: ["Long drive", "Limited activities", "Spotty cell service"],
      image_url: null,
      sort_order: 0,
      created_at: iso(-9),
    },
    {
      id: IDS.optBeach,
      item_id: IDS.decisionVacation,
      title: "Beach trip",
      description: null,
      pros: ["Warm", "Great food", "Lots to explore"],
      cons: ["More expensive", "Crowds", "Travel time"],
      image_url: null,
      sort_order: 1,
      created_at: iso(-9),
    },
    {
      id: IDS.optStay,
      item_id: IDS.decisionVacation,
      title: "Staycation",
      description: null,
      pros: ["Budget-friendly", "No travel stress", "Time for projects"],
      cons: ["Not a big change", "Easy to fill with chores", "Less adventure"],
      image_url: null,
      sort_order: 2,
      created_at: iso(-9),
    },
  ];

  const responses: DecisionResponse[] = [
    {
      id: "resp-1",
      item_id: IDS.decisionVacation,
      option_id: IDS.optBeach,
      user_id: IDS.trevor,
      note: "I'm leaning beach this year.",
      created_at: iso(-2),
      updated_at: iso(-2),
    },
  ];

  const goalDetails: GoalDetails[] = [
    {
      item_id: IDS.goalDateNight,
      tracking_type: "habit",
      target_value: 12,
      current_value: 7,
      unit: "weeks",
      weekly_frequency: 1,
      streak_count: 3,
    },
  ];

  const milestones: GoalMilestone[] = [];

  const financialDetails: FinancialDetails[] = [
    {
      item_id: IDS.financeEmergency,
      target_amount_cents: 1_200_000,
      current_amount_cents: 840_000,
    },
  ];

  const contributions: FinancialContribution[] = [
    {
      id: "contrib-1",
      item_id: IDS.financeEmergency,
      amount_cents: 50_000,
      contributor_id: IDS.trevor,
      contributed_at: iso(-6),
      note: "May transfer",
      created_at: iso(-6),
    },
    {
      id: "contrib-2",
      item_id: IDS.financeEmergency,
      amount_cents: 30_000,
      contributor_id: IDS.chanda,
      contributed_at: iso(-20),
      note: null,
      created_at: iso(-20),
    },
    {
      id: "contrib-3",
      item_id: IDS.financeEmergency,
      amount_cents: 50_000,
      contributor_id: IDS.trevor,
      contributed_at: iso(-34),
      note: null,
      created_at: iso(-34),
    },
  ];

  const comments: Comment[] = [
    {
      id: "c-1",
      item_id: IDS.decisionVacation,
      user_id: IDS.trevor,
      parent_id: null,
      body: "I've been thinking about a beach trip. Warm weather, good food, and lots to explore!",
      edited_at: null,
      created_at: iso(-3, 14),
      updated_at: iso(-3, 14),
    },
    {
      id: "c-2",
      item_id: IDS.decisionVacation,
      user_id: IDS.chanda,
      parent_id: "c-1",
      body: "The beach sounds amazing! I'm a little worried about the cost though. Could we look at shoulder season?",
      edited_at: null,
      created_at: iso(-2, 16),
      updated_at: iso(-2, 16),
    },
    {
      id: "c-3",
      item_id: IDS.decisionVacation,
      user_id: IDS.trevor,
      parent_id: null,
      body: "Totally fair. Lake cabin might be easier on the budget if we drive.",
      edited_at: null,
      created_at: iso(-1, 10),
      updated_at: iso(-1, 10),
    },
    {
      id: "c-4",
      item_id: IDS.goalDateNight,
      user_id: IDS.chanda,
      parent_id: null,
      body: "Last week's Italian night was perfect. Let's keep the streak going!",
      edited_at: null,
      created_at: iso(-4),
      updated_at: iso(-4),
    },
    {
      id: "c-5",
      item_id: IDS.goalDateNight,
      user_id: IDS.trevor,
      parent_id: null,
      body: "I'm in. Board game café this Friday?",
      edited_at: null,
      created_at: iso(-3),
      updated_at: iso(-3),
    },
    {
      id: "c-6",
      item_id: IDS.financeEmergency,
      user_id: IDS.trevor,
      parent_id: null,
      body: "Another $500 landed this month. We're getting close!",
      edited_at: null,
      created_at: iso(-5),
      updated_at: iso(-5),
    },
  ];

  const reactions: CommentReaction[] = [
    {
      id: "r-1",
      comment_id: "c-1",
      user_id: IDS.chanda,
      emoji: "❤️",
      created_at: iso(-3),
    },
    {
      id: "r-2",
      comment_id: "c-2",
      user_id: IDS.trevor,
      emoji: "👍",
      created_at: iso(-2),
    },
  ];

  const activity: ActivityEvent[] = [
    {
      id: "a-1",
      household_id: IDS.household,
      item_id: IDS.decisionVacation,
      actor_id: IDS.trevor,
      event_type: "created",
      summary: "Created by Trevor",
      metadata: null,
      created_at: iso(-10),
    },
    {
      id: "a-2",
      household_id: IDS.household,
      item_id: IDS.decisionVacation,
      actor_id: IDS.trevor,
      event_type: "option_added",
      summary: "Option \"Lake cabin\" added",
      metadata: { option: "Lake cabin" },
      created_at: iso(-9),
    },
    {
      id: "a-3",
      household_id: IDS.household,
      item_id: IDS.decisionVacation,
      actor_id: IDS.trevor,
      event_type: "response_recorded",
      summary: "Trevor recorded a response",
      metadata: null,
      created_at: iso(-2),
    },
    {
      id: "a-4",
      household_id: IDS.household,
      item_id: IDS.decisionVacation,
      actor_id: IDS.trevor,
      event_type: "due_date_changed",
      summary: "Deadline changed to May 30",
      metadata: null,
      created_at: iso(-1),
    },
  ];

  const notifications: Notification[] = [
    {
      id: "n-1",
      user_id: IDS.chanda,
      household_id: IDS.household,
      item_id: IDS.decisionVacation,
      type: "decision_response",
      title: "Your response is needed",
      body: "Trevor is waiting on Summer vacation location.",
      read_at: null,
      created_at: iso(-1),
    },
    {
      id: "n-2",
      user_id: IDS.trevor,
      household_id: IDS.household,
      item_id: IDS.taskDentist,
      type: "assignment",
      title: "New assignment",
      body: "Chanda assigned Book dentist appointments to you.",
      read_at: iso(0),
      created_at: iso(-2),
    },
  ];

  const notificationPrefs: NotificationPreferences[] = [
    {
      user_id: IDS.trevor,
      assignments: true,
      comments: true,
      mentions: true,
      decisions: true,
      deadlines: true,
      contributions: true,
    },
    {
      user_id: IDS.chanda,
      assignments: true,
      comments: true,
      mentions: true,
      decisions: true,
      deadlines: true,
      contributions: true,
    },
  ];

  return {
    sessionUserId: null as string | null,
    profiles,
    households,
    members,
    invitations,
    items,
    checklist,
    options,
    responses,
    goalDetails,
    milestones,
    financialDetails,
    contributions,
    comments,
    reactions,
    activity,
    notifications,
    notificationPrefs,
    checkIns: [] as WellnessCheckIn[],
    webauthnCredentials: [] as WebAuthnCredential[],
    decidedOutcomes: {} as Record<string, { option_id: string; summary: string }>,
  };
}

export type DemoState = ReturnType<typeof createSeedState>;
