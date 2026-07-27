-- Together tables only (does not touch existing tables)

CREATE TABLE IF NOT EXISTS together_profiles (
  id VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(191) NOT NULL,
  full_name VARCHAR(191) NOT NULL,
  avatar_url VARCHAR(191) NULL,
  timezone VARCHAR(191) NOT NULL DEFAULT 'America/Chicago',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE INDEX together_profiles_email_key(email),
  PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_households (
  id VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  created_by VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  INDEX together_households_created_by_fkey(created_by),
  CONSTRAINT together_households_created_by_fkey FOREIGN KEY (created_by) REFERENCES together_profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_household_members (
  id VARCHAR(191) NOT NULL,
  household_id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  role VARCHAR(191) NOT NULL,
  status VARCHAR(191) NOT NULL DEFAULT 'active',
  joined_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX together_household_members_household_id_user_id_key(household_id, user_id),
  PRIMARY KEY (id),
  INDEX together_household_members_user_id_fkey(user_id),
  CONSTRAINT together_household_members_household_id_fkey FOREIGN KEY (household_id) REFERENCES together_households(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT together_household_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES together_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_household_invitations (
  id VARCHAR(191) NOT NULL,
  household_id VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL,
  token VARCHAR(191) NOT NULL,
  invited_by VARCHAR(191) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  accepted_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX together_household_invitations_token_key(token),
  PRIMARY KEY (id),
  INDEX together_household_invitations_household_id_fkey(household_id),
  INDEX together_household_invitations_invited_by_fkey(invited_by),
  CONSTRAINT together_household_invitations_household_id_fkey FOREIGN KEY (household_id) REFERENCES together_households(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT together_household_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES together_profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_items (
  id VARCHAR(191) NOT NULL,
  household_id VARCHAR(191) NOT NULL,
  type VARCHAR(191) NOT NULL,
  title VARCHAR(191) NOT NULL,
  description TEXT NULL,
  status VARCHAR(191) NOT NULL,
  created_by VARCHAR(191) NOT NULL,
  owner_id VARCHAR(191) NULL,
  priority VARCHAR(191) NOT NULL DEFAULT 'normal',
  start_date DATETIME(3) NULL,
  due_date DATETIME(3) NULL,
  completed_at DATETIME(3) NULL,
  archived_at DATETIME(3) NULL,
  outcome TEXT NULL,
  decided_option_id VARCHAR(191) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  INDEX together_items_household_id_idx(household_id),
  INDEX together_items_type_idx(type),
  INDEX together_items_status_idx(status),
  INDEX together_items_owner_id_idx(owner_id),
  INDEX together_items_due_date_idx(due_date),
  INDEX together_items_created_by_fkey(created_by),
  CONSTRAINT together_items_household_id_fkey FOREIGN KEY (household_id) REFERENCES together_households(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT together_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES together_profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT together_items_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES together_profiles(id) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_task_checklist_items (
  id VARCHAR(191) NOT NULL,
  item_id VARCHAR(191) NOT NULL,
  title VARCHAR(191) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX together_task_checklist_items_item_id_fkey(item_id),
  CONSTRAINT together_task_checklist_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES together_items(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_decision_options (
  id VARCHAR(191) NOT NULL,
  item_id VARCHAR(191) NOT NULL,
  title VARCHAR(191) NOT NULL,
  description TEXT NULL,
  pros JSON NOT NULL,
  cons JSON NOT NULL,
  image_url VARCHAR(191) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX together_decision_options_item_id_fkey(item_id),
  CONSTRAINT together_decision_options_item_id_fkey FOREIGN KEY (item_id) REFERENCES together_items(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_decision_responses (
  id VARCHAR(191) NOT NULL,
  item_id VARCHAR(191) NOT NULL,
  option_id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  note TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  UNIQUE INDEX together_decision_responses_item_id_user_id_key(item_id, user_id),
  PRIMARY KEY (id),
  INDEX together_decision_responses_option_id_fkey(option_id),
  INDEX together_decision_responses_user_id_fkey(user_id),
  CONSTRAINT together_decision_responses_item_id_fkey FOREIGN KEY (item_id) REFERENCES together_items(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT together_decision_responses_option_id_fkey FOREIGN KEY (option_id) REFERENCES together_decision_options(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT together_decision_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES together_profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_goal_details (
  item_id VARCHAR(191) NOT NULL,
  tracking_type VARCHAR(191) NOT NULL,
  target_value DOUBLE NULL,
  current_value DOUBLE NOT NULL DEFAULT 0,
  unit VARCHAR(191) NULL,
  weekly_frequency INT NULL,
  streak_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (item_id),
  CONSTRAINT together_goal_details_item_id_fkey FOREIGN KEY (item_id) REFERENCES together_items(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_goal_milestones (
  id VARCHAR(191) NOT NULL,
  item_id VARCHAR(191) NOT NULL,
  title VARCHAR(191) NOT NULL,
  target_date DATETIME(3) NULL,
  completed_at DATETIME(3) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX together_goal_milestones_item_id_fkey(item_id),
  CONSTRAINT together_goal_milestones_item_id_fkey FOREIGN KEY (item_id) REFERENCES together_items(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_financial_details (
  item_id VARCHAR(191) NOT NULL,
  target_amount_cents INT NOT NULL,
  current_amount_cents INT NOT NULL DEFAULT 0,
  PRIMARY KEY (item_id),
  CONSTRAINT together_financial_details_item_id_fkey FOREIGN KEY (item_id) REFERENCES together_items(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_financial_contributions (
  id VARCHAR(191) NOT NULL,
  item_id VARCHAR(191) NOT NULL,
  amount_cents INT NOT NULL,
  contributor_id VARCHAR(191) NOT NULL,
  contributed_at DATETIME(3) NOT NULL,
  note TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX together_financial_contributions_item_id_fkey(item_id),
  INDEX together_financial_contributions_contributor_id_fkey(contributor_id),
  CONSTRAINT together_financial_contributions_item_id_fkey FOREIGN KEY (item_id) REFERENCES together_items(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT together_financial_contributions_contributor_id_fkey FOREIGN KEY (contributor_id) REFERENCES together_profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_comments (
  id VARCHAR(191) NOT NULL,
  item_id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  parent_id VARCHAR(191) NULL,
  body TEXT NOT NULL,
  edited_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  INDEX together_comments_item_id_fkey(item_id),
  INDEX together_comments_user_id_fkey(user_id),
  INDEX together_comments_parent_id_fkey(parent_id),
  CONSTRAINT together_comments_item_id_fkey FOREIGN KEY (item_id) REFERENCES together_items(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT together_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES together_profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT together_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES together_comments(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_comment_reactions (
  id VARCHAR(191) NOT NULL,
  comment_id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  emoji VARCHAR(191) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX together_comment_reactions_comment_id_user_id_emoji_key(comment_id, user_id, emoji),
  PRIMARY KEY (id),
  INDEX together_comment_reactions_user_id_fkey(user_id),
  CONSTRAINT together_comment_reactions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES together_comments(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT together_comment_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES together_profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_activity_events (
  id VARCHAR(191) NOT NULL,
  household_id VARCHAR(191) NOT NULL,
  item_id VARCHAR(191) NULL,
  actor_id VARCHAR(191) NOT NULL,
  event_type VARCHAR(191) NOT NULL,
  summary VARCHAR(191) NOT NULL,
  metadata JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX together_activity_events_household_id_fkey(household_id),
  INDEX together_activity_events_item_id_fkey(item_id),
  INDEX together_activity_events_actor_id_fkey(actor_id),
  CONSTRAINT together_activity_events_household_id_fkey FOREIGN KEY (household_id) REFERENCES together_households(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT together_activity_events_item_id_fkey FOREIGN KEY (item_id) REFERENCES together_items(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT together_activity_events_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES together_profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_notifications (
  id VARCHAR(191) NOT NULL,
  user_id VARCHAR(191) NOT NULL,
  household_id VARCHAR(191) NOT NULL,
  item_id VARCHAR(191) NULL,
  type VARCHAR(191) NOT NULL,
  title VARCHAR(191) NOT NULL,
  body TEXT NOT NULL,
  read_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX together_notifications_user_id_fkey(user_id),
  INDEX together_notifications_household_id_fkey(household_id),
  INDEX together_notifications_item_id_fkey(item_id),
  CONSTRAINT together_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES together_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT together_notifications_household_id_fkey FOREIGN KEY (household_id) REFERENCES together_households(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT together_notifications_item_id_fkey FOREIGN KEY (item_id) REFERENCES together_items(id) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS together_notification_preferences (
  user_id VARCHAR(191) NOT NULL,
  assignments BOOLEAN NOT NULL DEFAULT true,
  comments BOOLEAN NOT NULL DEFAULT true,
  mentions BOOLEAN NOT NULL DEFAULT true,
  decisions BOOLEAN NOT NULL DEFAULT true,
  deadlines BOOLEAN NOT NULL DEFAULT true,
  contributions BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (user_id),
  CONSTRAINT together_notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES together_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
